import { motion } from 'framer-motion'
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa'

const CAT_BADGE = {
  News:         'bg-blue-100 text-blue-800',
  Events:       'bg-purple-100 text-purple-800',
  Achievements: 'bg-yellow-100 text-yellow-800',
}

export default function NewsCard({ item, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-gold/30 flex flex-col"
    >
      <div className="relative overflow-hidden h-48">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className={`${CAT_BADGE[item.category] || 'bg-gray-100 text-gray-700'} text-xs font-montserrat font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full`}>
            {item.category}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-light font-montserrat mb-3">
          <FaCalendarAlt className="text-gold" />
          <span>{item.date}</span>
        </div>
        <h3 className="font-playfair text-lg font-semibold text-navy group-hover:text-gold transition-colors leading-snug mb-2">
          {item.title}
        </h3>
        <p className="text-sm text-slate leading-relaxed line-clamp-3 flex-1">{item.excerpt}</p>
        <button className="mt-4 flex items-center gap-2 text-gold hover:text-gold-dark text-sm font-montserrat font-semibold uppercase tracking-wider transition-colors self-start">
          Read More <FaArrowRight className="text-xs" />
        </button>
      </div>
    </motion.article>
  )
}
