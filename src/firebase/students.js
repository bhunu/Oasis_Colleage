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

// One-time backfill: sets studentId on feeAccounts docs that are missing it.
// Derives studentId from reg_number (same value; both fields should be present).
// Also backfills reg_number from studentId for any doc where reg_number is absent.
export async function backfillFeeAccountStudentIds() {
  const snap = await getDocs(collection(db, 'feeAccounts'))
  const toFix = snap.docs.filter(d => {
    const { studentId, reg_number } = d.data()
    return (!studentId && reg_number) || (!reg_number && studentId)
  })
  if (toFix.length === 0) return 0

  const BATCH_SIZE = 499
  for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    toFix.slice(i, i + BATCH_SIZE).forEach(d => {
      const { studentId, reg_number } = d.data()
      const updates = {}
      if (!studentId && reg_number) updates.studentId  = reg_number
      if (!reg_number && studentId) updates.reg_number = studentId
      batch.update(doc(db, 'feeAccounts', d.id), updates)
    })
    await batch.commit()
  }
  return toFix.length
}

// One-time backfill: renames legacy identifier fields to reg_number across all affected collections.
// receipts: regNumber → reg_number
// exeatApplications, exeatPasses, clearanceApplications, clearancePasses: regNo → reg_number
export async function backfillRegNumberFields() {
  const BATCH_SIZE = 499
  const totals = {}

  async function migrate(collectionName, oldField) {
    const snap = await getDocs(collection(db, collectionName))
    const toFix = snap.docs.filter(d => {
      const data = d.data()
      return data[oldField] && !data.reg_number
    })
    if (toFix.length === 0) { totals[collectionName] = 0; return }

    for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      toFix.slice(i, i + BATCH_SIZE).forEach(d => {
        batch.update(doc(db, collectionName, d.id), { reg_number: d.data()[oldField] })
      })
      await batch.commit()
    }
    totals[collectionName] = toFix.length
  }

  await migrate('receipts',              'regNumber')
  await migrate('exeatApplications',     'regNo')
  await migrate('exeatPasses',           'regNo')
  await migrate('clearanceApplications', 'regNo')
  await migrate('clearancePasses',       'regNo')

  return totals
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
