import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

export default function StatCounter({ value, label, suffix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const target = parseInt(value, 10)
    const duration = 2000
    const step = Math.ceil(target / (duration / 16))
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setCount(current)
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <div ref={ref} className="text-center px-6">
      <div className="font-playfair text-5xl md:text-6xl font-bold text-gold leading-none">
        {count}{suffix}
      </div>
      <div className="font-montserrat text-xs uppercase tracking-widest text-gray-300 mt-3">{label}</div>
    </div>
  )
}
