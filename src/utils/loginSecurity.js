import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { logSecurityEvent } from './logSecurityEvent'

const MAX_ATTEMPTS    = 3
const LOCKOUT_MS      = 3 * 60 * 1000    // 3 minutes

/** Deterministic doc ID from identifier + portal — always uppercase so reg numbers like R262681 are canonical */
function attemptDocId(identifier, portal) {
  return `${portal}__${identifier.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 80)}`
}

/**
 * Returns { locked: bool, lockedUntil: Date|null, attempts: number }
 * Safe to call without auth — uses public Firestore rule on loginAttempts.
 */
export async function checkLockStatus(identifier, portal) {
  if (!identifier?.trim()) return { locked: false, attempts: 0 }
  try {
    const snap = await getDoc(doc(db, 'loginAttempts', attemptDocId(identifier, portal)))
    if (!snap.exists()) return { locked: false, attempts: 0 }
    const data = snap.data()
    const until = data.lockedUntil?.toDate ? data.lockedUntil.toDate() : data.lockedUntil ? new Date(data.lockedUntil) : null
    if (until && until > new Date()) return { locked: true, lockedUntil: until, attempts: data.failedAttempts ?? 0 }
    return { locked: false, attempts: data.failedAttempts ?? 0 }
  } catch {
    return { locked: false, attempts: 0 }
  }
}

/**
 * Increments the failed attempt counter.
 * Returns { locked, attempts, remaining, lockedUntil }
 */
export async function recordFailedAttempt(identifier, portal) {
  if (!identifier?.trim()) return { locked: false, attempts: 1, remaining: MAX_ATTEMPTS - 1 }
  try {
    const ref  = doc(db, 'loginAttempts', attemptDocId(identifier, portal))
    const snap = await getDoc(ref)
    const prev = snap.exists() ? (snap.data().failedAttempts ?? 0) : 0
    const next = prev + 1
    const locked = next >= MAX_ATTEMPTS
    const lockedUntil = locked ? new Date(Date.now() + LOCKOUT_MS) : null

    await setDoc(ref, {
      identifier,
      portal,
      failedAttempts: next,
      lockedUntil,
      lastFailedAt: serverTimestamp(),
    }, { merge: true })

    if (locked) {
      await logSecurityEvent({ identifier, action: 'BRUTE_FORCE_DETECTED', role: portal })
    }

    return { locked, attempts: next, remaining: Math.max(0, MAX_ATTEMPTS - next), lockedUntil }
  } catch {
    return { locked: false, attempts: 1, remaining: MAX_ATTEMPTS - 1 }
  }
}

/** Clears the attempt counter after a successful login. */
export async function resetAttempts(identifier, portal) {
  if (!identifier?.trim()) return
  try {
    await setDoc(doc(db, 'loginAttempts', attemptDocId(identifier, portal)), {
      identifier,
      portal,
      failedAttempts: 0,
      lockedUntil:    null,
      lastFailedAt:   null,
    }, { merge: true })
  } catch {}
}
