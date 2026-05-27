import { db } from './config'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

const col = () => collection(db, 'news')

export const getNews    = async () => (await getDocs(query(col(), orderBy('createdAt', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }))
export const addNews    = (data) => addDoc(col(), { ...data, createdAt: serverTimestamp() })
export const updateNews = (id, data) => updateDoc(doc(db, 'news', id), { ...data, updatedAt: serverTimestamp() })
export const deleteNews = (id) => deleteDoc(doc(db, 'news', id))
