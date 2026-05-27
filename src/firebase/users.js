import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'users'
const usersRef   = () => collection(db, COLLECTION)

export async function getUsers() {
  const snap = await getDocs(query(usersRef(), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addUser({ name, email, role }) {
  return addDoc(usersRef(), {
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  })
}

export async function updateUser(id, updates) {
  return updateDoc(doc(db, COLLECTION, id), updates)
}

export async function deleteUser(id) {
  return deleteDoc(doc(db, COLLECTION, id))
}
