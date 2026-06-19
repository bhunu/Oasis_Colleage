import {
  doc, runTransaction, getDocs, collection, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COUNTER_REF = () => doc(db, 'receipts', '__counter__')

// Extracts the numeric suffix from a receipt number like "RCP-2025-0042" → 42
function parseReceiptNum(receiptNumber) {
  const parts = (receiptNumber || '').split('-')
  return parseInt(parts[parts.length - 1] || '0', 10) || 0
}

// Returns the next sequential receipt number as "RCP-YYYY-NNNN".
// Uses a Firestore transaction on a counter document so concurrent calls
// never generate the same number. On first call, seeds the counter from
// the highest existing receipt number to avoid conflicts with old records.
export async function getNextReceiptNumber() {
  const year = new Date().getFullYear()

  const num = await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(COUNTER_REF())

    let next
    if (counterSnap.exists()) {
      next = (counterSnap.data().lastNumber || 0) + 1
    } else {
      // First time: seed from the highest existing receipt number
      const existing = await getDocs(
        query(collection(db, 'receipts'), orderBy('issuedAt', 'desc'), limit(1))
      )
      const seed = existing.empty
        ? 0
        : parseReceiptNum(existing.docs[0].data().receiptNumber)
      next = seed + 1
    }

    tx.set(COUNTER_REF(), { lastNumber: next }, { merge: true })
    return next
  })

  return `RCP-${year}-${String(num).padStart(4, '0')}`
}
