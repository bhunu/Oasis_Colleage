import { motion } from 'framer-motion'
import { FaQuoteLeft } from 'react-icons/fa'

export default function TestimonialCard({ quote, name, role, avatar, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="bg-navy-light rounded-2xl p-8 border border-gold/20 hover:border-gold/50 transition-all duration-300 relative"
    >
      <FaQuoteLeft className="text-gold/30 text-5xl absolute top-6 right-6" />
      <p className="text-gray-300 leading-relaxed text-base italic relative z-10 mb-6">
        "{quote}"
      </p>
      <div className="flex items-center gap-4 border-t border-white/10 pt-5">
        {avatar && (
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-gold/40" />
        )}
        {!avatar && (
          <div className="w-12 h-12 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center font-playfair text-gold text-lg font-bold">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-playfair font-semibold text-white">{name}</div>
          <div className="text-gold text-xs font-montserrat uppercase tracking-widest mt-0.5">{role}</div>
        </div>
      </div>
    </motion.div>
  )
}
