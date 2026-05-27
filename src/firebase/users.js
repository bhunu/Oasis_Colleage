import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp, query, orderBy, where, limit,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'users'
const usersRef   = () => collection(db, COLLECTION)

export async function adminExists() {
  const snap = await getDocs(query(usersRef(), where('role', '==', 'admin'), limit(1)))
  return !snap.empty
}

export async function findUserByCredential(field, value) {
  const snap = await getDocs(query(usersRef(), where(field, '==', value), limit(1)))
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function getUsers() {
  const snap = await getDocs(query(usersRef(), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addUser(data) {
  return addDoc(usersRef(), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateUser(id, updates) {
  return updateDoc(doc(db, COLLECTION, id), updates)
}

export async function deleteUser(id) {
  return deleteDoc(doc(db, COLLECTION, id))
}
