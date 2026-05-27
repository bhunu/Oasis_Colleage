import { db } from './config'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

const col = () => collection(db, 'events')

export const getEvents    = async () => (await getDocs(query(col(), orderBy('date', 'asc')))).docs.map(d => ({ id: d.id, ...d.data() }))
export const addEvent     = (data) => addDoc(col(), { ...data, createdAt: serverTimestamp() })
export const updateEvent  = (id, data) => updateDoc(doc(db, 'events', id), { ...data, updatedAt: serverTimestamp() })
export const deleteEvent  = (id) => deleteDoc(doc(db, 'events', id))
