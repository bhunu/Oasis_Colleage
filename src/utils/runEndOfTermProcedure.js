import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function runEndOfTermProcedure(closingTerm, openingTerm, adminEmail, onProgress) {
  try {
    // STEP 1: Verify all accounts exist
    const accountsQuery = query(
      collection(db, 'feeAccounts'),
      where('term', '==', `${closingTerm.number}-${closingTerm.year}`),
      where('status', '==', 'open')
    )
    const accountsSnapshot = await getDocs(accountsQuery)

    if (accountsSnapshot.empty) {
      throw new Error(`No open accounts found for ${closingTerm.number} — ${closingTerm.year}`)
    }

    const totalAccounts = accountsSnapshot.docs.length
    let processedCount = 0

    onProgress({
      step: 1,
      progress: 0,
      log: `Verifying ${totalAccounts} accounts...`,
    })

    // STEP 2: Lock all accounts
    const batch1 = writeBatch(db)
    accountsSnapshot.docs.forEach((doc) => {
      batch1.update(doc.ref, { status: 'locked', lockedAt: serverTimestamp() })
    })
    await batch1.commit()

    onProgress({
      step: 2,
      progress: 20,
      log: `Locked ${totalAccounts} accounts`,
    })

    // STEP 3: Calculate balances and close accounts
    const closingBatch = writeBatch(db)
    const arrearsTotal = { amount: 0, count: 0 }
    const creditsTotal = { amount: 0, count: 0 }

    accountsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const balance = (data.totalCharged || 0) - (data.totalPaid || 0)

      let balanceType = 'nil'
      if (balance > 0) balanceType = 'debit'
      if (balance < 0) balanceType = 'credit'

      if (balance > 0) {
        arrearsTotal.amount += balance
        arrearsTotal.count += 1
      } else if (balance < 0) {
        creditsTotal.amount += Math.abs(balance)
        creditsTotal.count += 1
      }

      closingBatch.update(doc.ref, {
        status: 'closed',
        closingBalance: balance,
        balanceCF: balance,
        balanceType: balanceType,
        closedAt: serverTimestamp(),
        closedBy: adminEmail,
      })
    })
    await closingBatch.commit()

    processedCount += totalAccounts
    onProgress({
      step: 3,
      progress: 50,
      log: `Calculated balances for ${processedCount} accounts\nArrears: ${arrearsTotal.count} accounts ($${arrearsTotal.amount.toFixed(2)})\nCredits: ${creditsTotal.count} accounts ($${creditsTotal.amount.toFixed(2)})`,
    })

    // STEP 4: Post opening balances for next term
    const openingBatch = writeBatch(db)
    accountsSnapshot.docs.forEach((accountDoc) => {
      const data = accountDoc.data()
      const balance = (data.totalCharged || 0) - (data.totalPaid || 0)

      if (balance !== 0) {
        const newAccountId = `${data.studentId}_${openingTerm.number}-${openingTerm.year}`
        const newAccountRef = doc(db, 'feeAccounts', newAccountId)

        openingBatch.set(newAccountRef, {
          studentId: data.studentId,
          studentName: data.studentName,
          class: data.class,
          term: `${openingTerm.number}-${openingTerm.year}`,
          status: 'open',
          totalCharged: 0,
          totalPaid: 0,
          balance: balance,
          balanceType: balance > 0 ? 'debit' : 'credit',
          balanceBD: balance, // Balance brought down from previous term
          transactions: [
            {
              date: new Date().toISOString(),
              description: balance > 0 ? 'Balance c/d (Arrears)' : 'Balance c/d (Advance)',
              type: 'opening',
              debit: balance > 0 ? balance : 0,
              credit: balance < 0 ? Math.abs(balance) : 0,
              reference: `EOT-${closingTerm.number}-${closingTerm.year}`,
            },
          ],
          createdAt: serverTimestamp(),
        })
      }
    })
    await openingBatch.commit()

    onProgress({
      step: 4,
      progress: 75,
      log: `Posted opening balances for Term ${openingTerm.number} — ${openingTerm.year}`,
    })

    // STEP 5: Update term status
    await updateDoc(doc(db, 'termPeriods', `${closingTerm.number}-${closingTerm.year}`), {
      status: 'closed',
      closedAt: serverTimestamp(),
    })

    const openingTermId = `${openingTerm.number}-${openingTerm.year}`
    const openingTermRef = doc(db, 'termPeriods', openingTermId)
    await setDoc(openingTermRef, {
      number: openingTerm.number,
      year: openingTerm.year,
      status: 'open',
      startDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
    })

    onProgress({
      step: 5,
      progress: 100,
      log: `End of term procedure completed successfully!\nProcessed: ${totalAccounts} accounts\nArrears carried: $${arrearsTotal.amount.toFixed(2)}\nCredits carried: $${creditsTotal.amount.toFixed(2)}`,
    })

    return {
      success: true,
      accountsClosed: totalAccounts,
      arrearsTotal: arrearsTotal.amount,
      creditsTotal: creditsTotal.amount,
    }
  } catch (error) {
    console.error('End of term procedure error:', error)
    throw error
  }
}
