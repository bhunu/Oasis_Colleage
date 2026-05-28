import { Navigate } from 'react-router-dom'

const WEB_ADMIN_ROLES = ['admin', 'staff']

export default function AdminRoute({ children }) {
  const raw = sessionStorage.getItem('adminSession')

  if (!raw) return <Navigate to="/login?portal=web-admin" replace />

  try {
    const session = JSON.parse(raw)
    if (!WEB_ADMIN_ROLES.includes(session?.role)) {
      sessionStorage.removeItem('adminSession')
      return <Navigate to="/login?portal=web-admin" replace />
    }
  } catch {
    sessionStorage.removeItem('adminSession')
    return <Navigate to="/login?portal=web-admin" replace />
  }

  return children
}
