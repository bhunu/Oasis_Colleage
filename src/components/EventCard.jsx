import { CATEGORY_STYLES } from '../constants/categories'

export default function EventCard({ event, onClick }) {
  const cat = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.academic
  const date = new Date(event.date + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()

  return (
    <div
      onClick={onClick}
      className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gold/40 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="flex-shrink-0 w-14 h-14 bg-navy rounded-lg flex flex-col items-center justify-center text-white">
        <span className="font-playfair text-xl font-bold leading-none text-gold">{day}</span>
        <span className="font-montserrat text-xs uppercase tracking-wider mt-0.5">{month}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-playfair font-semibold text-navy group-hover:text-gold transition-colors line-clamp-1">
            {event.title}
          </h4>
          <span className={`flex-shrink-0 ${cat.bg} ${cat.text} text-xs font-montserrat font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full`}>
            {cat.label}
          </span>
        </div>
        {event.time && (
          <p className="text-xs text-slate-light mt-1 font-montserrat">{event.time}</p>
        )}
        {event.location && (
          <p className="text-xs text-slate-light mt-0.5 font-montserrat truncate">{event.location}</p>
        )}
        {event.description && (
          <p className="text-sm text-slate mt-1 line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  )
}
