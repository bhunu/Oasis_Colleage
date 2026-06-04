/**
 * One-time migration: fix `studentId` in the `users` collection where it was
 * accidentally stored as the Firestore document ID instead of the reg_number.
 *
 * HOW TO RUN:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" and save the file as:
 *        scripts/serviceAccount.json   (already in .gitignore)
 *   3. Run:  node scripts/fix-student-ids.js
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)
const admin   = require('firebase-admin')

const __dirname     = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db = admin.firestore()

// Reg numbers always look like R260001 — 7 chars total (R + 2-digit year + 4-digit number)
const REG_NUMBER_RE = /^R\d{6}$/

async function run() {
  console.log('Fetching all student user records…')

  const snap = await db.collection('users').where('role', '==', 'student').get()
  console.log(`Total student records: ${snap.size}`)

  const broken = snap.docs.filter(d => !REG_NUMBER_RE.test(d.data().studentId ?? ''))
  console.log(`Broken records (wrong studentId): ${broken.length}\n`)

  if (broken.length === 0) {
    console.log('Nothing to fix — all records look correct.')
    return
  }

  let fixed = 0
  let skipped = 0

  for (const userDoc of broken) {
    const { studentId, email } = userDoc.data()

    // studentId here is actually the Firestore doc ID of the student document
    const studentSnap = await db.collection('students').doc(studentId).get()

    if (!studentSnap.exists) {
      console.warn(`  [SKIP] users/${userDoc.id}  — students/${studentId} not found  (email: ${email})`)
      skipped++
      continue
    }

    const reg_number = studentSnap.data().reg_number
    if (!reg_number) {
      console.warn(`  [SKIP] users/${userDoc.id}  — student doc has no reg_number  (email: ${email})`)
      skipped++
      continue
    }

    await userDoc.ref.update({
      studentId:  reg_number,
      updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`  [FIXED] users/${userDoc.id}  ${studentId}  →  ${reg_number}  (${email})`)
    fixed++
  }

  console.log(`\nDone.  Fixed: ${fixed}  |  Skipped: ${skipped}`)
}

run().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
