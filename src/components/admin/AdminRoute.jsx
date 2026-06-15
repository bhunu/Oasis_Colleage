import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { verifyRoleAccess } from '../../utils/roleGuard'
import { logSecurityEvent } from '../../utils/logSecurityEvent'

const WEB_ADMIN_ROLES = ['admin', 'staff']

function Spinner() {
  return (
    <div className="fixed inset-0 bg-[#0A1628] flex items-center justify-center z-50">
      <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const session = sessionStorage.getItem('adminSession')

      if (!user || !session) {
        if (session) sessionStorage.removeItem('adminSession')
        setStatus('denied')
        return
      }

      const result = await verifyRoleAccess(user, WEB_ADMIN_ROLES)

      if (!result.allowed) {
        await logSecurityEvent({
          uid:           user.uid,
          action:        result.reason === 'WRONG_ROLE' ? 'WRONG_ROLE_ACCESS' : 'UNAUTHORISED_ROUTE_ACCESS',
          attemptedRole: 'web-admin',
          actualRole:    result.actualRole ?? 'none',
        })
        await signOut(auth)
        sessionStorage.removeItem('adminSession')
        setStatus('denied')
        return
      }

      setStatus('allowed')
    })

    return () => unsubscribe()
  }, [])

  if (status === 'checking') return <Spinner />
  if (status === 'denied')   return <Navigate to="/staff-login?portal=web-admin" replace />
  return children
}
