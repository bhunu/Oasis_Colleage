import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

/** Maps each Firebase-Auth role to its login page */
export const ROLE_LOGIN_PAGES = {
  bursar:  '/staff-login?portal=bursar',
  student: '/login',
}

/**
 * Verifies that a Firebase Auth user has the expected role in Firestore.
 * Returns { allowed, reason, actualRole?, userData? }
 */
export async function verifyRoleAccess(user, requiredRole) {
  if (!user) return { allowed: false, reason: 'NO_AUTH' }
  try {
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (!snap.exists())                   return { allowed: false, reason: 'NO_USER_DOC' }
    const data = snap.data()
    if (data.isLocked)                    return { allowed: false, reason: 'ACCOUNT_LOCKED' }
    if (data.role !== requiredRole)       return { allowed: false, reason: 'WRONG_ROLE', actualRole: data.role }
    return { allowed: true, userData: data }
  } catch {
    return { allowed: false, reason: 'ERROR' }
  }
}
