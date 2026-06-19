import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Write a security event to Firestore.
 * Never throws — a logging failure must never break the auth flow.
 */
export async function logSecurityEvent(data) {
  try {
    await addDoc(collection(db, 'securityLogs'), {
      ...data,
      uid:        data.uid        ?? null,
      identifier: data.identifier ?? null,
      action:     data.action,
      role:       data.role       ?? data.attemptedRole ?? null,
      actualRole: data.actualRole ?? null,
      url:        window.location.pathname,
      userAgent:  navigator.userAgent,
      timestamp:  serverTimestamp(),
    })
  } catch {
    // intentionally silent
  }
}
