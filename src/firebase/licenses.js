import { db } from './config'
import {
  collection, getDocs, addDoc, updateDoc, doc,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'

const COL = 'licenses'

export async function getLicenses() {
  const snap = await getDocs(query(collection(db, COL), orderBy('issuedAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addLicense(data) {
  return addDoc(collection(db, COL), {
    ...data,
    issuedAt: serverTimestamp(),
    status:   'active',
  })
}

export async function updateLicense(id, updates) {
  return updateDoc(doc(db, COL, id), updates)
}

export async function suspendLicense(id) {
  return updateDoc(doc(db, COL, id), { status: 'suspended', suspendedAt: serverTimestamp() })
}

export async function reactivateLicense(id) {
  return updateDoc(doc(db, COL, id), { status: 'active', reactivatedAt: serverTimestamp() })
}
