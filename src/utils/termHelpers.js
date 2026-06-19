export function getTermLabel(termNumber, year) {
  const labels = {
    1: 'Term 1',
    2: 'Term 2',
    3: 'Term 3',
  }
  return `${labels[termNumber]} — ${year}`
}

export function getCurrentTerm() {
  const month = new Date().getMonth() + 1 // 1-12
  const year  = new Date().getFullYear()
  const number = month <= 4 ? 1 : month <= 8 ? 2 : 3
  return { number, year }
}

export function getNextTerm(currentTerm) {
  if (currentTerm.number === 3) {
    return { number: 1, year: currentTerm.year + 1 }
  }
  return { number: currentTerm.number + 1, year: currentTerm.year }
}

// Accepts "Term 2", "2", 2 — always returns the numeric term number.
export function parseTermNumber(value) {
  if (typeof value === 'number') return value
  return parseInt(String(value).replace(/^Term\s*/i, ''), 10)
}

// Returns the canonical Firestore termId used in feeAccounts: "2-2025"
export function formatTermId(termNumber, year) {
  return `${parseTermNumber(termNumber)}-${year}`
}

// Returns the display label used in receipts collection: "Term 2"
export function formatTermLabel(termNumber) {
  return `Term ${parseTermNumber(termNumber)}`
}
