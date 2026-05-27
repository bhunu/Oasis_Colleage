import { motion } from 'framer-motion'
import { FaUser, FaStar } from 'react-icons/fa'
import { DEPT_STYLES } from '../constants/departments'

function DeptBadge({ department }) {
  const style = DEPT_STYLES[department] || { bg: 'bg-gray-500', text: 'text-white' }
  return (
    <span className={`inline-block ${style.bg} ${style.text} text-xs font-montserrat font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full`}>
      {department}
    </span>
  )
}

function Avatar({ photo, name, className }) {
  if (photo) {
    return <img src={photo} alt={name} className={`${className} object-cover object-center`} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
  }
  return (
    <div className={`${className} bg-navy/10 flex items-center justify-center`}>
      <FaUser className="text-navy/30 text-4xl" />
    </div>
  )
}

export default function StaffCard({ name, title, department, qualification, description, photo, featured, size = 'md' }) {
  if (size === 'sm') {
    return (
      <div className="flex flex-col items-center text-center bg-white/5 border border-white/10 hover:border-gold/40 rounded-2xl p-5 transition-all duration-300 group">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gold/20 group-hover:ring-gold transition-all duration-300 mb-3 flex-shrink-0 bg-navy/20">
          <Avatar photo={photo} name={name} className="w-full h-full" />
        </div>
        <p className="font-playfair font-bold text-white text-sm group-hover:text-gold transition-colors leading-tight">{name}</p>
        <p className="font-montserrat text-xs text-gold/70 mt-0.5 mb-2 leading-tight">{title}</p>
        <DeptBadge department={department} />
      </div>
    )
  }

  if (size === 'lg') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gold/30 group h-full">
        <div className="h-64 overflow-hidden bg-gray-100 relative">
          <Avatar photo={photo} name={name} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
          {featured && (
            <div className="absolute top-3 right-3 bg-gold text-navy text-xs font-montserrat font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <FaStar className="text-[9px]" /> Leadership
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="w-full h-1 bg-gold rounded-full mb-4" />
          <h3 className="font-playfair text-xl font-bold text-navy">{name}</h3>
          <p className="font-montserrat text-xs text-gold uppercase tracking-widest mt-1 mb-2">{title}</p>
          <DeptBadge department={department} />
          {qualification && <p className="text-xs text-slate-light italic mt-2">{qualification}</p>}
          {description && <p className="text-slate text-sm leading-relaxed mt-3 line-clamp-3">{description}</p>}
        </div>
      </div>
    )
  }

  // Default: md
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gold/30 group flex flex-col h-full">
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <Avatar photo={photo} name={name} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
        {featured && (
          <div className="absolute top-3 right-3 bg-gold text-navy text-xs font-montserrat font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <FaStar className="text-[9px]" /> Lead
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-playfair text-base font-bold text-navy group-hover:text-gold transition-colors leading-tight">{name}</h3>
        <p className="font-montserrat text-xs text-gold uppercase tracking-wider mt-1 mb-2 leading-tight">{title}</p>
        <DeptBadge department={department} />
        {qualification && <p className="text-xs text-slate-light italic mt-2 line-clamp-1">{qualification}</p>}
        {description && <p className="text-slate text-sm leading-relaxed mt-2 line-clamp-2 flex-1">{description}</p>}
      </div>
    </div>
  )
}
