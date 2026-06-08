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
