import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaChevronRight } from 'react-icons/fa'

export default function PageHero({ title, subtitle, breadcrumb = [], image }) {
  return (
    <section className="relative h-64 sm:h-80 md:h-96 flex items-end pb-12 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80'})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/60" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {breadcrumb.length > 0 && (
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-sm font-montserrat mb-3"
          >
            <Link to="/" className="text-gold/70 hover:text-gold transition-colors">Home</Link>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <FaChevronRight className="text-gold/50 text-xs" />
                {crumb.href
                  ? <Link to={crumb.href} className="text-gold/70 hover:text-gold transition-colors">{crumb.label}</Link>
                  : <span className="text-gold">{crumb.label}</span>}
              </span>
            ))}
          </motion.nav>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-white"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-3 text-lg text-gray-300 max-w-xl"
          >
            {subtitle}
          </motion.p>
        )}
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ transformOrigin: 'left' }}
          className="block mt-4 w-20 h-1 bg-gold rounded-full"
        />
      </div>
    </section>
  )
}
