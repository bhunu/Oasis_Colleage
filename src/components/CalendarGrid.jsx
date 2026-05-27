import { motion } from 'framer-motion'
import { CATEGORY_STYLES } from '../constants/categories'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarGrid({ year, month, getEventsForDate, onDayClick, activeCategories }) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center font-montserrat text-xs font-semibold uppercase tracking-wider text-slate-light py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="aspect-square" />

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const allEvents = getEventsForDate(dateStr)
            const events = allEvents.filter(e => activeCategories.has(e.category))
            const isToday = dateStr === todayStr

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.02 }}
                onClick={() => onDayClick(dateStr, allEvents)}
                className={`aspect-square p-1 rounded-lg border transition-all duration-150 flex flex-col items-center text-xs ${
                  isToday
                    ? 'bg-navy border-gold text-white font-bold'
                    : events.length > 0
                    ? 'bg-white border-gold/30 hover:border-gold hover:bg-gold/5'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`font-montserrat text-sm leading-none mt-1 ${isToday ? 'text-gold' : 'text-slate-dark'}`}>
                  {day}
                </span>
                <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-0.5">
                  {events.slice(0, 3).map((e, idx) => {
                    const cat = CATEGORY_STYLES[e.category]
                    return (
                      <span key={idx} className={`w-1.5 h-1.5 rounded-full ${cat?.dot || 'bg-gray-400'}`} />
                    )
                  })}
                  {events.length > 3 && (
                    <span className="text-gray-400 text-xs leading-none">+</span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
