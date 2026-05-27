import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHero from '../components/PageHero'
import CalendarGrid from '../components/CalendarGrid'
import EventCard from '../components/EventCard'
import { CATEGORY_STYLES } from '../constants/categories'
import AdminPIN from '../components/AdminPIN'
import Toast from '../components/Toast'
import { useCalendar } from '../hooks/useCalendar'
import { usePIN } from '../hooks/usePIN'
import { FaChevronLeft, FaChevronRight, FaPlus, FaEdit, FaTrash, FaTimes, FaCalendarAlt } from 'react-icons/fa'

const ALL_CATEGORIES = ['academic', 'sports', 'sports-events', 'cultural', 'admin', 'holiday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const emptyForm = { title:'', date:'', endDate:'', category:'academic', description:'', time:'', location:'' }

export default function Calendar() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [activeCategories, setActiveCategories] = useState(new Set(ALL_CATEGORIES))
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedEvents, setSelectedEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const { events, addEvent, updateEvent, deleteEvent, getEventsForDate, getUpcomingEvents } = useCalendar()
  const { unlocked } = usePIN()

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  const toggleCategory = (cat) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const handleDayClick = (dateStr, evts) => {
    setSelectedDay(dateStr)
    setSelectedEvents(evts)
  }

  const openAdd = () => {
    setEditingEvent(null)
    setForm({ ...emptyForm, date: selectedDay || '' })
    setShowForm(true)
  }

  const openEdit = (event) => {
    setEditingEvent(event)
    setForm({ ...event })
    setShowForm(true)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.date) return
    if (editingEvent) {
      updateEvent(editingEvent.id, form)
      setToast({ msg: 'Event updated successfully.', type: 'success' })
    } else {
      addEvent(form)
      setToast({ msg: 'Event added to calendar.', type: 'success' })
    }
    setShowForm(false)
    setEditingEvent(null)
    setForm(emptyForm)
    if (selectedDay) setSelectedEvents(getEventsForDate(selectedDay))
  }

  const handleDelete = (id) => {
    deleteEvent(id)
    setSelectedEvents(prev => prev.filter(e => e.id !== id))
    setDeleteConfirm(null)
    setToast({ msg: 'Event deleted.', type: 'success' })
  }

  const upcoming = getUpcomingEvents(10).filter(e => activeCategories.has(e.category))

  return (
    <>
      <PageHero
        title="School Calendar"
        subtitle="Stay up to date with all academic, sporting, cultural, and administrative events."
        breadcrumb={[{ label: 'Calendar' }]}
        image="https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80"
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <section className="section-padding bg-cream">
        <div className="container-max">

          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => {
                const s = CATEGORY_STYLES[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-2 font-montserrat text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      activeCategories.has(cat)
                        ? `${s.bg} ${s.text} border-current`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                )
              })}
            </div>
            <AdminPIN onUnlocked={() => setShowAdmin(true)} />
          </div>

          {/* Admin panel */}
          {unlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => setShowAdmin(v => !v)}
                className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors mb-4"
              >
                {showAdmin ? <FaTimes /> : <FaCalendarAlt />}
                {showAdmin ? 'Close Admin Panel' : 'Open Admin Panel'}
              </button>

              <AnimatePresence>
                {showAdmin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-navy/5 border border-navy/10 rounded-2xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-playfair font-bold text-navy text-xl">Manage Calendar Events</h3>
                        <button
                          onClick={openAdd}
                          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                        >
                          <FaPlus /> Add Event
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-navy/5 text-left">
                              <th className="font-montserrat text-xs text-navy uppercase tracking-wide px-3 py-2">Date</th>
                              <th className="font-montserrat text-xs text-navy uppercase tracking-wide px-3 py-2">Title</th>
                              <th className="font-montserrat text-xs text-navy uppercase tracking-wide px-3 py-2">Category</th>
                              <th className="font-montserrat text-xs text-navy uppercase tracking-wide px-3 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map(event => {
                              const cat = CATEGORY_STYLES[event.category]
                              return (
                                <tr key={event.id} className="border-t border-gray-200 hover:bg-white transition-colors">
                                  <td className="px-3 py-2 font-montserrat text-xs text-slate-light">{event.date}</td>
                                  <td className="px-3 py-2 font-sans text-navy font-medium">{event.title}</td>
                                  <td className="px-3 py-2">
                                    <span className={`${cat?.bg} ${cat?.text} text-xs font-montserrat uppercase tracking-wide px-2 py-0.5 rounded-full`}>{cat?.label}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-2">
                                      <button onClick={() => openEdit(event)} className="text-blue-500 hover:text-blue-700 p-1 transition-colors"><FaEdit /></button>
                                      <button onClick={() => setDeleteConfirm(event.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors"><FaTrash /></button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar grid */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center bg-cream hover:bg-gold/10 rounded-lg transition-colors text-navy">
                    <FaChevronLeft />
                  </button>
                  <div className="text-center">
                    <h2 className="font-playfair text-2xl font-bold text-navy">{MONTHS[month]}</h2>
                    <p className="font-montserrat text-xs text-slate-light uppercase tracking-widest">{year}</p>
                  </div>
                  <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center bg-cream hover:bg-gold/10 rounded-lg transition-colors text-navy">
                    <FaChevronRight />
                  </button>
                </div>

                <CalendarGrid
                  year={year}
                  month={month}
                  getEventsForDate={getEventsForDate}
                  onDayClick={handleDayClick}
                  activeCategories={activeCategories}
                />
              </div>

              {/* Category legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {ALL_CATEGORIES.map(cat => {
                  const s = CATEGORY_STYLES[cat]
                  return (
                    <div key={cat} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="font-montserrat text-xs text-slate-light">{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-playfair font-bold text-navy text-lg mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-gold" /> Upcoming Events
                </h3>
                {upcoming.length === 0 ? (
                  <p className="text-slate-light text-sm text-center py-6">No upcoming events.</p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map(event => (
                      <EventCard key={event.id} event={event} onClick={() => handleDayClick(event.date, getEventsForDate(event.date))} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Day events modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-navy px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h3 className="font-playfair text-white font-bold text-lg">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-ZW', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-gold text-xs font-montserrat mt-0.5">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-white transition-colors">
                  <FaTimes />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {selectedEvents.length === 0 ? (
                  <p className="text-slate-light text-center py-8">No events on this day.</p>
                ) : (
                  selectedEvents.map(event => (
                    <div key={event.id} className="relative">
                      <EventCard event={event} />
                      {unlocked && (
                        <div className="flex gap-2 mt-1 justify-end">
                          <button onClick={() => { openEdit(event); setSelectedDay(null) }} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 font-montserrat">
                            <FaEdit /> Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(event.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 font-montserrat">
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {unlocked && (
                  <button
                    onClick={() => { openAdd(); setSelectedDay(null) }}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gold/40 hover:border-gold text-gold hover:text-gold-dark py-3 rounded-xl font-montserrat text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <FaPlus /> Add Event for This Day
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-navy px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h3 className="font-playfair text-white font-bold text-lg">{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label-tag text-slate-dark block mb-1.5">Event Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold" placeholder="Enter event title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Date *</label>
                    <input type="date" required value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">End Date</label>
                    <input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" />
                  </div>
                </div>
                <div>
                  <label className="label-tag text-slate-dark block mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white">
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_STYLES[c].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-tag text-slate-dark block mb-1.5">Description</label>
                  <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none" placeholder="Event description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Time</label>
                    <input value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" placeholder="e.g. 9:00 AM" />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Location</label>
                    <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" placeholder="e.g. School Hall" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold uppercase tracking-wider text-sm py-3 rounded-lg transition-colors shadow-lg">
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-slate font-montserrat font-semibold text-sm py-3 rounded-lg transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-xl" />
              </div>
              <h3 className="font-playfair font-bold text-navy text-xl mb-2">Delete Event?</h3>
              <p className="text-slate text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-montserrat font-semibold text-sm py-2.5 rounded-lg transition-colors">
                  Delete
                </button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border-2 border-gray-200 text-slate font-montserrat font-semibold text-sm py-2.5 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
