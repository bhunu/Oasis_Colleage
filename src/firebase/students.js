import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp,
  query, orderBy, where, limit,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'students'
const ref = () => collection(db, COLLECTION)

export async function addStudent(data) {
  return addDoc(ref(), { ...data, createdAt: serverTimestamp() })
}

export async function getStudents() {
  const snap = await getDocs(query(ref(), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getStudentByRegNumber(reg_number) {
  const snap = await getDocs(query(ref(), where('reg_number', '==', reg_number), limit(1)))
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function updateStudent(id, updates) {
  return updateDoc(doc(db, COLLECTION, id), updates)
}

export async function deleteStudent(id) {
  return deleteDoc(doc(db, COLLECTION, id))
}
