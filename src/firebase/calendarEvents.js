import { db } from './config'
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'

const col = () => collection(db, 'calendarEvents')

export const getCalendarEvents = async () =>
  (await getDocs(query(col(), orderBy('date', 'asc')))).docs.map(d => ({
    id: d.id,
    ...d.data(),
  }))

export const addCalendarEvent    = (data) => addDoc(col(), { ...data, createdAt: serverTimestamp() })
export const updateCalendarEvent = (id, data) => updateDoc(doc(db, 'calendarEvents', id), data)
export const deleteCalendarEvent = (id) => deleteDoc(doc(db, 'calendarEvents', id))
