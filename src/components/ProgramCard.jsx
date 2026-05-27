import { motion } from 'framer-motion'

export default function ProgramCard({ icon: Icon, title, description, subjects, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:border-gold/50 hover:shadow-xl transition-all duration-300 group flex flex-col"
    >
      <div className="w-14 h-14 bg-navy rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold transition-colors duration-300">
        <Icon className="text-gold text-2xl group-hover:text-navy transition-colors duration-300" />
      </div>
      <h3 className="font-playfair text-xl font-bold text-navy mb-3 group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-slate text-sm leading-relaxed mb-4 flex-1">{description}</p>
      {subjects && (
        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
          {subjects.map((s, i) => (
            <span key={i} className="bg-gold/10 text-gold-dark text-xs font-montserrat font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
