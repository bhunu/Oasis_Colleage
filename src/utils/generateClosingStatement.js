export function generateClosingStatement(account, term) {
  return {
    studentId: account.studentId,
    studentName: account.studentName,
    term: term,
    closingBalance: account.balance,
    balanceType: account.balanceType,
    chargedAmount: account.totalCharged,
    paidAmount: account.totalPaid,
    generatedAt: new Date().toISOString(),
  }
}
