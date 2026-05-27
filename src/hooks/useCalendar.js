import { useState, useCallback, useEffect } from 'react'
import {
  getCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../firebase/calendarEvents'

export function useCalendar() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCalendarEvents()
      .then(setEvents)
      .catch(err => console.error('Failed to load calendar events:', err))
      .finally(() => setLoading(false))
  }, [])

  const addEvent = useCallback(async (event) => {
    // Optimistic: add with temp id immediately so calendar updates instantly
    const tempId   = `temp_${Date.now()}`
    const optimistic = { ...event, id: tempId }
    setEvents(prev => [...prev, optimistic].sort((a, b) => a.date.localeCompare(b.date)))
    try {
      const ref = await addCalendarEvent(event)
      setEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: ref.id } : e))
    } catch (err) {
      console.error('Failed to save event:', err)
      setEvents(prev => prev.filter(e => e.id !== tempId))
    }
  }, [])

  const updateEvent = useCallback(async (id, updates) => {
    // Optimistic: apply update instantly
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    try {
      await updateCalendarEvent(id, updates)
    } catch (err) {
      console.error('Failed to update event:', err)
      // Reload from Firestore to recover correct state
      getCalendarEvents().then(setEvents)
    }
  }, [])

  const deleteEvent = useCallback(async (id) => {
    // Optimistic: remove instantly
    setEvents(prev => prev.filter(e => e.id !== id))
    try {
      await deleteCalendarEvent(id)
    } catch (err) {
      console.error('Failed to delete event:', err)
      getCalendarEvents().then(setEvents)
    }
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

  return { events, loading, addEvent, updateEvent, deleteEvent, getEventsForDate, getUpcomingEvents }
}
