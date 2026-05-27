import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

export default function Lightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) {
  useEffect(() => {
    if (!photo) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [photo, onClose, onPrev, onNext, hasPrev, hasNext])

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-gold/80 rounded-full flex items-center justify-center text-white hover:text-navy transition-all z-10"
          >
            <FaTimes />
          </button>

          {/* Prev */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-gold rounded-full flex items-center justify-center text-white hover:text-navy transition-all z-10"
            >
              <FaChevronLeft />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={photo.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={photo.src}
              alt={photo.caption}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center px-4">
              <p className="text-white text-base font-sans">{photo.caption}</p>
              <span className="text-gold/70 text-xs font-montserrat uppercase tracking-widest mt-1 block">{photo.category} · {photo.date}</span>
            </div>
          </motion.div>

          {/* Next */}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-gold rounded-full flex items-center justify-center text-white hover:text-navy transition-all z-10"
            >
              <FaChevronRight />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
