import { useStudent } from '../../context/StudentContext'
import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { logSecurityEvent } from '../../utils/logSecurityEvent'
import { auth } from '../../firebase/config'

function Spinner() {
  return (
    <div className="fixed inset-0 bg-[#0A1628] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 font-montserrat text-xs uppercase tracking-widest">Loading…</p>
      </div>
    </div>
  )
}

export default function StudentProtectedRoute({ children }) {
  const { studentData, loading } = useStudent()
  const user = auth.currentUser

  // Log cross-role attempts once we know auth state is resolved
  useEffect(() => {
    if (loading) return
    if (user && !studentData) {
      logSecurityEvent({
        uid:           user.uid,
        action:        'WRONG_ROLE_ACCESS',
        attemptedRole: 'student',
        actualRole:    'unknown',
      })
    }
  }, [loading, user, studentData])

  if (loading) return <Spinner />

  if (!studentData) return <Navigate to="/login?portal=student-portal" replace />

  /* OTP used but password not set — enforce setup */
  if (!studentData.hasSetupPassword) return <Navigate to="/student/setup-password" replace />

  return children
}

/** Lighter guard used on /student/setup-password */
export function StudentAuthRoute({ children }) {
  const { studentData, loading, authLoading } = useStudent()

  if (loading || authLoading) return <Spinner />

  if (!studentData) return <Navigate to="/login?portal=student-portal" replace />

  if (studentData.hasSetupPassword) return <Navigate to="/student/dashboard" replace />

  return children
}
