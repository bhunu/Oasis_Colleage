import { useEffect, useRef } from 'react'
import { useStudent } from '../context/StudentContext'
import toast from 'react-hot-toast'

/**
 * Watches for user inactivity and signs the student out after
 * portalSettings.sessionTimeoutMinutes of no activity.
 */
export default function useStudentSessionTimeout() {
  const { portalSettings, logout } = useStudent()
  const timerRef = useRef(null)

  useEffect(() => {
    const minutes = portalSettings?.sessionTimeoutMinutes ?? 4
    const ms = minutes * 60 * 1000

    const reset = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        toast('Session timed out. Please sign in again.', { icon: '🔒' })
        logout()
      }, ms)
    }

    const EVENTS = ['mousemove', 'keydown', 'touchstart', 'click']
    EVENTS.forEach(ev => window.addEventListener(ev, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(timerRef.current)
      EVENTS.forEach(ev => window.removeEventListener(ev, reset))
    }
  }, [portalSettings?.sessionTimeoutMinutes, logout])
}
