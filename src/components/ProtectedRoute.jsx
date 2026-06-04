import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const raw = sessionStorage.getItem('studentsAdminSession')

  if (!raw) return <Navigate to="/staff-login?portal=students-records" replace />

  try {
    const session = JSON.parse(raw)
    if (session?.role !== 'Student Admin') {
      sessionStorage.removeItem('studentsAdminSession')
      return <Navigate to="/staff-login?portal=students-records" replace />
    }
  } catch {
    sessionStorage.removeItem('studentsAdminSession')
    return <Navigate to="/staff-login?portal=students-records" replace />
  }

  return children
}
