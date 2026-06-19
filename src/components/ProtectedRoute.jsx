import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { verifyRoleAccess } from '../utils/roleGuard'
import { logSecurityEvent } from '../utils/logSecurityEvent'

function Spinner() {
  return (
    <div className="fixed inset-0 bg-navy flex items-center justify-center z-50">
      <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const session = sessionStorage.getItem('studentsAdminSession')

      if (!user || !session) {
        if (session) sessionStorage.removeItem('studentsAdminSession')
        setStatus('denied')
        return
      }

      const result = await verifyRoleAccess(user, 'Student Admin')

      if (!result.allowed) {
        await logSecurityEvent({
          uid:           user.uid,
          action:        result.reason === 'WRONG_ROLE' ? 'WRONG_ROLE_ACCESS' : 'UNAUTHORISED_ROUTE_ACCESS',
          attemptedRole: 'students-records',
          actualRole:    result.actualRole ?? 'none',
        })
        await signOut(auth)
        sessionStorage.removeItem('studentsAdminSession')
        setStatus('denied')
        return
      }

      setStatus('allowed')
    })

    return () => unsubscribe()
  }, [])

  if (status === 'checking') return <Spinner />
  if (status === 'denied')   return <Navigate to="/staff-login?portal=students-records" replace />
  return children
}
