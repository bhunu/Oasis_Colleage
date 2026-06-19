import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/config'
import { Navigate } from 'react-router-dom'
import Login from '../pages/Login'

function getPortalRedirect() {
  if (sessionStorage.getItem('teacherSession'))       return '/teacher'
  if (sessionStorage.getItem('bursarSession'))        return '/bursar/dashboard'
  if (sessionStorage.getItem('studentSession'))       return '/student/dashboard'
  if (sessionStorage.getItem('studentsAdminSession')) return '/dashboard'
  return null
}

export default function LoginRedirect() {
  const [user, loading] = useAuthState(auth)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    const redirect = getPortalRedirect()
    return <Navigate to={redirect ?? '/login'} replace />
  }

  return <Login />
}
