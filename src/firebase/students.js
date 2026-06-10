import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, serverTimestamp,
  query, orderBy, where, limit, writeBatch,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'students'
const ref = () => collection(db, COLLECTION)

// "Lower 6 / Upper 6" → A Level  |  everything else (Form 1A, 2B…) → O Level
export function getStudentCategory(className) {
  if (!className) return 'O Level'
  return /^(Lower|Upper)\s*6/i.test(String(className).trim()) ? 'A Level' : 'O Level'
}

export async function addStudent(data) {
  return addDoc(ref(), {
    ...data,
    student_category: getStudentCategory(data.class),
    createdAt: serverTimestamp(),
  })
}

// One-time backfill: writes student_category to every doc that is missing it
export async function backfillStudentCategories() {
  const snap = await getDocs(ref())
  const toFix = snap.docs.filter(d => !d.data().student_category)
  if (toFix.length === 0) return 0

  const BATCH_SIZE = 499
  for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    toFix.slice(i, i + BATCH_SIZE).forEach(d => {
      batch.update(doc(db, COLLECTION, d.id), {
        student_category: getStudentCategory(d.data().class),
      })
    })
    await batch.commit()
  }
  return toFix.length
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
