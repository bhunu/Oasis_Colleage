import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { verifyRoleAccess } from '../../utils/roleGuard'
import { logSecurityEvent } from '../../utils/logSecurityEvent'

function Spinner() {
  return (
    <div className="fixed inset-0 bg-[#0A1628] flex items-center justify-center z-50">
      <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function TeacherProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const session = sessionStorage.getItem('teacherSession')

      if (!user || !session) {
        if (session) sessionStorage.removeItem('teacherSession')
        setStatus('denied')
        return
      }

      const result = await verifyRoleAccess(user, 'teacher')

      if (!result.allowed) {
        await logSecurityEvent({
          uid:           user.uid,
          action:        result.reason === 'WRONG_ROLE' ? 'WRONG_ROLE_ACCESS' : 'UNAUTHORISED_ROUTE_ACCESS',
          attemptedRole: 'teacher',
          actualRole:    result.actualRole ?? 'none',
        })
        await signOut(auth)
        sessionStorage.removeItem('teacherSession')
        setStatus('denied')
        return
      }

      setStatus('allowed')
    })
    return () => unsubscribe()
  }, [])

  if (status === 'checking') return <Spinner />
  if (status === 'denied')   return <Navigate to="/staff-login?portal=teacher" replace />
  return children
}
