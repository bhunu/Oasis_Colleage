import { useEffect, useRef } from 'react'
import {
  doc, updateDoc, onSnapshot,
  serverTimestamp, runTransaction, deleteField,
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { logSecurityEvent } from '../utils/logSecurityEvent'
import { useStudent } from '../context/StudentContext'

const MAX_SESSIONS = 2
const PING_INTERVAL_MS = 60_000

// Single document that holds all active sessions as a map field.
// Using a named doc avoids collection queries inside transactions.
function registryRef(uid) {
  return doc(db, 'users', uid, 'activeSessions', '__sessions__')
}

/**
 * Called once at student login.
 * Atomically enforces MAX_SESSIONS: if the limit is reached the oldest
 * session is evicted inside the same transaction, so two concurrent logins
 * can never both sneak past the check.
 */
export async function initStudentSession(uid) {
  const sessionId = crypto.randomUUID()
  sessionStorage.setItem('studentSessionId', sessionId)

  const ref = registryRef(uid)
  let evictedId = null

  await runTransaction(db, async (txn) => {
    const snap     = await txn.get(ref)
    const sessions = snap.exists() ? snap.data() : {}

    // Sort existing sessions oldest-first to find the one to evict
    const sorted = Object.entries(sessions)
      .map(([id, data]) => ({ id, loginAt: data.loginAt?.toMillis?.() ?? 0 }))
      .sort((a, b) => a.loginAt - b.loginAt)

    const next = { ...sessions }

    if (sorted.length >= MAX_SESSIONS) {
      evictedId = sorted[0].id
      delete next[evictedId]
    }

    next[sessionId] = {
      loginAt:      serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      userAgent:    navigator.userAgent,
    }

    txn.set(ref, next)
  })

  if (evictedId) {
    logSecurityEvent({ uid, action: 'CONCURRENT_SESSION_KILLED' }).catch(() => {})
  }

  return sessionId
}

/**
 * Removes this session from the registry on voluntary logout.
 * Uses deleteField() so the other sessions in the map are untouched.
 */
export async function endStudentSession(uid) {
  const sessionId = sessionStorage.getItem('studentSessionId')
  if (!sessionId || !uid) return
  try {
    await updateDoc(registryRef(uid), { [sessionId]: deleteField() })
  } catch {}
  sessionStorage.removeItem('studentSessionId')
}

/**
 * Hook used inside StudentLayout.
 * Watches the sessions registry doc and signs the student out when
 * their session entry is removed (concurrent session kill).
 */
export default function useStudentSessionGuard(uid) {
  const navigate = useNavigate()
  const { logout } = useStudent()
  const pingRef  = useRef(null)

  useEffect(() => {
    if (!uid) return

    const sessionId = sessionStorage.getItem('studentSessionId')
    if (!sessionId) return

    const ref = registryRef(uid)

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists() || !(sessionId in (snap.data() ?? {}))) {
        logSecurityEvent({ uid, action: 'CONCURRENT_SESSION_KILLED' })
        logout()
        navigate('/login?portal=student-portal', {
          replace: true,
          state: { message: 'You were signed out because your account was accessed from another device.' },
        })
      }
    }, () => {})

    pingRef.current = setInterval(() => {
      updateDoc(ref, { [`${sessionId}.lastActiveAt`]: serverTimestamp() }).catch(() => {})
    }, PING_INTERVAL_MS)

    return () => {
      unsubscribe()
      clearInterval(pingRef.current)
    }
  }, [uid, navigate, logout])
}
