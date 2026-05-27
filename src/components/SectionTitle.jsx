import { motion } from 'framer-motion'

export default function SectionTitle({ label, title, subtitle, align = 'center', light = false }) {
  const isCenter = align === 'center'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-14 ${isCenter ? 'text-center' : 'text-left'}`}
    >
      {label && (
        <span className={`font-montserrat text-xs font-semibold uppercase tracking-widest ${light ? 'text-gold' : 'text-gold'} block mb-3`}>
          {label}
        </span>
      )}
      <h2 className={`font-playfair text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${light ? 'text-white' : 'text-navy'}`}>
        {title}
      </h2>
      <span className={`gold-line-${isCenter ? 'center' : 'left'}`} />
      {subtitle && (
        <p className={`mt-6 text-lg leading-relaxed max-w-2xl ${isCenter ? 'mx-auto' : ''} ${light ? 'text-gray-300' : 'text-slate-light'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
