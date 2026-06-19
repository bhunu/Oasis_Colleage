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
    const minutes = portalSettings?.sessionTimeoutMinutes ?? 20
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

    // Pause timer when tab loses focus; resume (with a fresh countdown) when it returns.
    // This prevents activity in other tabs from keeping this session alive.
    const handleVisibility = () => {
      if (document.hidden) clearTimeout(timerRef.current)
      else reset()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    reset()

    return () => {
      clearTimeout(timerRef.current)
      EVENTS.forEach(ev => window.removeEventListener(ev, reset))
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [portalSettings?.sessionTimeoutMinutes, logout])
}
