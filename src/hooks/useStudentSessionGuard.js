import { useEffect, useRef } from 'react'
import {
  doc, setDoc, deleteDoc, onSnapshot,
  collection, getDocs, query, orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { logSecurityEvent } from '../utils/logSecurityEvent'

const MAX_SESSIONS = 2
const PING_INTERVAL_MS = 60_000

/** Called once at student login to register a new session and enforce the limit. */
export async function initStudentSession(uid) {
  const sessionId = crypto.randomUUID()
  sessionStorage.setItem('studentSessionId', sessionId)

  const sessRef = collection(db, 'users', uid, 'activeSessions')

  // Enforce max sessions: kill oldest if at limit
  try {
    const snap = await getDocs(query(sessRef, orderBy('loginAt', 'asc')))
    if (snap.size >= MAX_SESSIONS) {
      await deleteDoc(snap.docs[0].ref)
      await logSecurityEvent({ uid, action: 'CONCURRENT_SESSION_KILLED' })
    }
  } catch {}

  await setDoc(doc(sessRef, sessionId), {
    sessionId,
    loginAt:      serverTimestamp(),
    lastActiveAt: serverTimestamp(),
    userAgent:    navigator.userAgent,
  })

  return sessionId
}

/** Called on student logout to clean up the session record. */
export async function endStudentSession(uid) {
  const sessionId = sessionStorage.getItem('studentSessionId')
  if (!sessionId || !uid) return
  try {
    await deleteDoc(doc(db, 'users', uid, 'activeSessions', sessionId))
  } catch {}
  sessionStorage.removeItem('studentSessionId')
}

/**
 * Hook used inside StudentLayout.
 * Watches the active session document and signs the student out if another
 * device deletes it (concurrent session kill).
 */
export default function useStudentSessionGuard(uid) {
  const navigate    = useNavigate()
  const pingRef     = useRef(null)

  useEffect(() => {
    if (!uid) return

    const sessionId = sessionStorage.getItem('studentSessionId')
    if (!sessionId) return

    const sessionRef = doc(db, 'users', uid, 'activeSessions', sessionId)

    // Watch for external deletion
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) {
        signOut(auth).catch(() => {})
        sessionStorage.clear()
        logSecurityEvent({ uid, action: 'CONCURRENT_SESSION_KILLED' })
        navigate('/login?portal=student-portal', {
          replace: true,
          state: { message: 'You were signed out because your account was accessed from another device.' },
        })
      }
    }, () => {})

    // Heartbeat to keep lastActiveAt fresh
    pingRef.current = setInterval(() => {
      setDoc(sessionRef, { lastActiveAt: serverTimestamp() }, { merge: true }).catch(() => {})
    }, PING_INTERVAL_MS)

    return () => {
      unsubscribe()
      clearInterval(pingRef.current)
    }
  }, [uid, navigate])
}
