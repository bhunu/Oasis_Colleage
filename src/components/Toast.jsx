import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-24 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-2xl max-w-sm"
          style={{ background: type === 'success' ? '#0A1628' : '#7f1d1d', border: '1px solid #C9A84C' }}
        >
          {type === 'success'
            ? <FaCheckCircle className="text-gold text-lg flex-shrink-0" />
            : <FaTimesCircle className="text-red-400 text-lg flex-shrink-0" />}
          <span className="text-white font-sans text-sm flex-1">{message}</span>
          <button onClick={onClose} className="text-slate-light hover:text-white transition-colors ml-2">
            <FaTimes />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
