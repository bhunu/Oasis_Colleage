import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function generateStudentId() {
  const year = new Date().getFullYear()
  const counterRef = doc(db, 'config', 'lastStudentId')

  const newId = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef)
    const lastId = counterDoc.exists() ? counterDoc.data().count : 0
    const nextId = lastId + 1
    transaction.set(counterRef, { count: nextId })
    return nextId
  })

  return `OC-${year}-${String(newId).padStart(4, '0')}`
}
