import { useState, useCallback } from 'react'

const CORRECT_PIN = '2026'
const SESSION_KEY = 'oasis_admin_unlocked'

export function usePIN() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  )

  const unlock = useCallback((pin) => {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setUnlocked(true)
      return true
    }
    return false
  }, [])

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }, [])

  return { unlocked, unlock, lock }
}
