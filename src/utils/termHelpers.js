export function getTermLabel(termNumber, year) {
  const labels = {
    1: 'Term 1',
    2: 'Term 2',
    3: 'Term 3',
  }
  return `${labels[termNumber]} — ${year}`
}

export function getCurrentTerm() {
  // Default to Term 2, 2025
  return { number: 2, year: 2025 }
}

export function getNextTerm(currentTerm) {
  if (currentTerm.number === 3) {
    return { number: 1, year: currentTerm.year + 1 }
  }
  return { number: currentTerm.number + 1, year: currentTerm.year }
}
