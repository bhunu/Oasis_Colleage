import { runTransaction, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function generateRegNumber() {
  const year       = String(new Date().getFullYear()).slice(-2)
  const counterRef = doc(db, 'counters', 'regNumber')

  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = snap.exists() ? (snap.data().lastSequence ?? 0) + 1 : 1
    tx.set(counterRef, { lastSequence: next }, { merge: true })
    return next
  })

  return `R${year}${String(seq).padStart(4, '0')}`
}
