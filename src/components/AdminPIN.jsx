import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaLock, FaUnlock } from 'react-icons/fa'
import { usePIN } from '../hooks/usePIN'

export default function AdminPIN({ onUnlocked }) {
  const { unlocked, unlock, lock } = usePIN()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = unlock(pin)
    if (ok) {
      setShowForm(false)
      setPin('')
      setError(false)
      onUnlocked?.()
    } else {
      setError(true)
      setPin('')
    }
  }

  if (unlocked) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold text-xs font-montserrat font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
          <FaUnlock className="text-xs" /> Admin Unlocked
        </span>
        <button
          onClick={lock}
          className="text-xs text-slate-light hover:text-navy transition-colors font-montserrat"
        >
          Lock
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowForm(v => !v)}
        className="inline-flex items-center gap-2 text-slate-light hover:text-navy text-xs font-montserrat uppercase tracking-wider transition-colors"
      >
        <FaLock className="text-xs" />
        Manage
      </button>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            className={`w-20 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-gold/50 font-montserrat ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            autoFocus
          />
          <button type="submit" className="bg-gold hover:bg-gold-light text-navy text-xs font-montserrat font-semibold uppercase tracking-wider px-3 py-1.5 rounded transition-colors">
            Enter
          </button>
          {error && <span className="text-red-500 text-xs">Incorrect PIN</span>}
        </motion.form>
      )}
    </div>
  )
}
