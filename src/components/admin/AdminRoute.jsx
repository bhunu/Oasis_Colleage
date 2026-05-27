import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const session = sessionStorage.getItem('adminSession')
  if (!session) return <Navigate to="/login?portal=web-admin" replace />
  return children
}
