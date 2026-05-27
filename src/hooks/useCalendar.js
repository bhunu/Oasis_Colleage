import { useState, useCallback } from 'react'

const STORAGE_KEY = 'oasis_calendar_events_v3'

function d(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const Y = 2026
const SAMPLE_EVENTS = [
  { id: '1',  title: 'Term 2 Begins',                  date: d(Y,5,4),  endDate: null,      category: 'academic',  description: 'Students return for Term 2. All students must report by 6:30 AM.',                                                          time: '6:30 AM',          location: 'School Grounds' },
  { id: '2',  title: 'Zimbabwe Workers Day',            date: d(Y,5,1),  endDate: null,      category: 'holiday',   description: 'National public holiday — Workers Day. No school.',                                                                         time: null,               location: null },
  { id: '3',  title: 'Africa Day (Public Holiday)',     date: d(Y,5,25), endDate: null,      category: 'holiday',   description: 'Africa Day public holiday. School closed.',                                                                                 time: null,               location: null },
  { id: '4',  title: 'Parent-Teacher Consultations',   date: d(Y,5,16), endDate: null,      category: 'academic',  description: 'Term 2 parent-teacher meetings. Parents meet form teachers and subject teachers to discuss student progress.',                time: '8:00 AM – 4:00 PM', location: 'Classrooms' },
  { id: '5',  title: 'Inter-School Debate Competition', date: d(Y,5,22), endDate: null,      category: 'cultural',  description: 'Oasis hosts the annual inter-school debate. Theme: "Education is the most powerful weapon we have."',                        time: '9:00 AM',          location: 'School Hall' },
  { id: '6',  title: 'Annual Sports Day',              date: d(Y,5,30), endDate: null,      category: 'sports-events', description: 'Oasis Annual Sports Day. All four houses compete in athletics and field events for the overall championship. Parents warmly welcome.', time: '7:30 AM', location: 'School Sports Ground' },
  { id: '7',  title: 'Mid-Term Break',                 date: d(Y,5,18), endDate: d(Y,5,22), category: 'holiday',   description: 'Mid-term school break. Students return on Monday 25 May.',                                                                  time: null,               location: null },
  { id: '8',  title: 'Drama Festival',                 date: d(Y,6,5),  endDate: null,      category: 'cultural',  description: 'Annual school drama festival showcasing original plays and performances by students across all forms.',                        time: '2:00 PM',          location: 'School Hall' },
  { id: '9',  title: 'Form 4 & U6 Mock Exams Begin',  date: d(Y,6,8),  endDate: d(Y,6,19), category: 'admin',     description: 'Mock examinations for Form 4 (O-Level) and Upper 6 (A-Level) candidates. Normal timetable suspended during this period.',     time: '8:00 AM',          location: 'Examination Halls' },
  { id: '10', title: 'Football Inter-House Tournament', date: d(Y,6,6),  endDate: d(Y,6,7),  category: 'sports-events', description: 'Annual inter-house football tournament for boys and girls. All four houses compete for the championship shield.',           time: '1:00 PM',          location: 'Football Field' },
  { id: '11', title: 'Open Day & Admissions Fair',     date: d(Y,6,13), endDate: null,      category: 'academic',  description: 'Annual Open Day for prospective families. Tour the campus, meet teachers, learn about our programmes. 2027 applications open.', time: '9:00 AM – 1:00 PM', location: 'Whole Campus' },
  { id: '12', title: 'Cultural Day Celebrations',      date: d(Y,6,20), endDate: null,      category: 'cultural',  description: "Celebrate Zimbabwe's rich cultural diversity with traditional dances, attire, food, and heritage crafts.",                      time: '8:00 AM',          location: 'School Grounds & Hall' },
  { id: '13', title: 'School Prize Giving Ceremony',   date: d(Y,6,26), endDate: null,      category: 'admin',     description: 'End-of-term prize giving celebrating academic achievement, sporting excellence, and cultural contributions.',                  time: '10:00 AM',         location: 'School Hall' },
  { id: '14', title: 'End of Term 2 Examinations',     date: d(Y,6,22), endDate: d(Y,6,26), category: 'admin',     description: 'End-of-Term 2 internal examinations for Forms 1–3 and Lower 6.',                                                              time: '8:00 AM',          location: 'Classrooms' },
  { id: '15', title: 'Term 2 Closes',                  date: d(Y,6,27), endDate: null,      category: 'academic',      description: 'Last day of Term 2. Students collect report cards. School closes at noon.',                                                time: '6:30 AM – 12:00 PM', location: 'School Grounds' },
  { id: '16', title: 'Inter-School Football Tournament', date: d(Y,7,4), endDate: null,     category: 'sports-events', description: 'Oasis hosts the annual inter-school football tournament. Come support our boys\' and girls\' teams as they compete for district glory!', time: '8:00 AM',          location: 'Oasis Sports Grounds' },
  { id: '17', title: 'District Athletics Championships', date: d(Y,7,19), endDate: d(Y,7,20), category: 'sports-events', description: 'Our athletics team competes in the Chipinge District Championships. Track, field, and cross-country events over two days.', time: '8:00 AM',          location: 'Chipinge Sports Complex' },
]

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_EVENTS))
    return SAMPLE_EVENTS
  } catch {
    return SAMPLE_EVENTS
  }
}

function persist(events) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)) } catch {}
}

export function useCalendar() {
  const [events, setEvents] = useState(loadEvents)

  const addEvent = useCallback((event) => {
    const e = { ...event, id: Date.now().toString() }
    setEvents(prev => { const next = [...prev, e]; persist(next); return next })
    return e
  }, [])

  const updateEvent = useCallback((id, updates) => {
    setEvents(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      persist(next); return next
    })
  }, [])

  const deleteEvent = useCallback((id) => {
    setEvents(prev => { const next = prev.filter(e => e.id !== id); persist(next); return next })
  }, [])

  const getEventsForDate = useCallback((dateStr) => {
    return events.filter(e => {
      if (e.date === dateStr) return true
      if (e.endDate) return dateStr >= e.date && dateStr <= e.endDate
      return false
    })
  }, [events])

  const getUpcomingEvents = useCallback((count = 10) => {
    const today = new Date().toISOString().split('T')[0]
    return [...events]
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, count)
  }, [events])

  return { events, addEvent, updateEvent, deleteEvent, getEventsForDate, getUpcomingEvents }
}
