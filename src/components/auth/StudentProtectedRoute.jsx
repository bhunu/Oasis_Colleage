import { useStudent } from '../../context/StudentContext'
import { Navigate } from 'react-router-dom'

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

  if (loading) return <Spinner />
  if (!studentData) return <Navigate to="/login?portal=student-portal" replace />
  if (!studentData.hasSetupPassword) return <Navigate to="/student/setup-password" replace />

  return children
}

/* Boarder-only route — redirects day scholars to dashboard */
export function BoarderRoute({ children }) {
  const { studentData, loading, isBoarder } = useStudent()

  if (loading) return <Spinner />
  if (!studentData) return <Navigate to="/login?portal=student-portal" replace />
  if (!studentData.hasSetupPassword) return <Navigate to="/student/setup-password" replace />
  if (!isBoarder) return <Navigate to="/student/dashboard" replace />

  return children
}

export function StudentAuthRoute({ children }) {
  const { studentData, loading, authLoading } = useStudent()

  if (loading || authLoading) return <Spinner />
  if (!studentData) return <Navigate to="/login?portal=student-portal" replace />
  if (studentData.hasSetupPassword) return <Navigate to="/student/dashboard" replace />

  return children
}
