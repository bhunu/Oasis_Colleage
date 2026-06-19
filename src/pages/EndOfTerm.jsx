import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MdWarning as IconAlertTriangle, MdRefresh } from 'react-icons/md'
import StepTracker from '../components/StepTracker'
import ProgressModal from '../components/ProgressModal'
import ConfirmModal from '../components/ConfirmModal'
import { runEndOfTermProcedure } from '../utils/runEndOfTermProcedure'
import { parseTermNumber } from '../utils/termHelpers'
import toast from 'react-hot-toast'

const fmt = v => `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

function nextTerm(closing) {
  if (closing.number < 3) return { number: closing.number + 1, year: closing.year }
  return { number: 1, year: closing.year + 1 }
}

function getAdminEmail() {
  try {
    const s = JSON.parse(sessionStorage.getItem('studentsAdminSession') || '{}')
    return s.email || s.name || 'unknown'
  } catch { return 'unknown' }
}

export default function EndOfTerm() {
  const [closingTerm,  setClosingTerm]  = useState(null)
  const [openingTerm,  setOpeningTerm]  = useState(null)
  const [currentStep,  setCurrentStep]  = useState(0)
  const [isRunning,    setIsRunning]    = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [progressLog,  setProgressLog]  = useState('')
  const [progress,     setProgress]     = useState(0)
  const [completed,    setCompleted]    = useState(false)

  const [summary,      setSummary]      = useState(null)
  const [preview,      setPreview]      = useState([])
  const [preflight,    setPreflight]    = useState('loading') // 'loading' | 'done' | 'error'
  const [result,       setResult]       = useState(null)     // stores summary after completion

  /* ── Pre-flight: load term from portalSettings then count feeAccounts ── */
  const runPreflight = async () => {
    setPreflight('loading')
    setSummary(null)
    setPreview([])
    try {
      const settingsSnap = await getDoc(doc(db, 'portalSettings', 'main'))
      if (!settingsSnap.exists()) throw new Error('Portal settings not configured')

      const { currentTerm, currentYear } = settingsSnap.data()
      const closing = { number: parseTermNumber(currentTerm), year: Number(currentYear) }
      const opening = nextTerm(closing)
      setClosingTerm(closing)
      setOpeningTerm(opening)

      const termId = `${closing.number}-${closing.year}`
      const snap = await getDocs(
        query(collection(db, 'feeAccounts'), where('term', '==', termId))
      )

      const accounts = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      const debitAccounts  = accounts.filter(a => a.balanceType === 'debit')
      const creditAccounts = accounts.filter(a => a.balanceType === 'credit')
      const nilAccounts    = accounts.filter(a => !a.balanceType || a.balance === 0 || a.balanceType === 'nil')

      const computed = {
        totalAccounts: accounts.length,
        nilBalance:    nilAccounts.length,
        arrearsCount:  debitAccounts.length,
        arrearsTotal:  debitAccounts.reduce((s, a) => s + (a.balance || 0), 0),
        creditsCount:  creditAccounts.length,
        creditsTotal:  creditAccounts.reduce((s, a) => s + (a.balance || 0), 0),
      }
      setSummary(computed)

      // Preview: first 10 sorted by balance desc (highest debt first)
      const sorted = [...accounts].sort((a, b) => (b.balance || 0) - (a.balance || 0))
      setPreview(sorted.slice(0, 10))
      setPreflight('done')
    } catch (err) {
      console.error(err)
      setPreflight('error')
    }
  }

  useEffect(() => { runPreflight() }, [])

  const handleProgressUpdate = (data) => {
    setCurrentStep(data.step - 1)
    setProgress(data.progress)
    setProgressLog(data.log)
  }

  const handleRunProcedure = async () => {
    setShowConfirm(false)
    setIsRunning(true)
    try {
      const procedureResult = await runEndOfTermProcedure(closingTerm, openingTerm, getAdminEmail(), handleProgressUpdate)
      setResult({
        totalAccounts: procedureResult.accountsClosed,
        arrearsTotal:  procedureResult.arrearsTotal,
        creditsTotal:  procedureResult.creditsTotal,
      })
      setCompleted(true)
      toast.success('End of term procedure completed!')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to run procedure')
      setIsRunning(false)
    }
  }

  /* ── Completion screen ── */
  if (completed) {
    return (
      <div className="max-w-4xl">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Procedure Completed</h3>
          <p className="text-gray-700 mb-6">
            Term {closingTerm?.number} — {closingTerm?.year} has been successfully closed
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded p-4">
              <p className="text-gray-600 text-sm mb-1">Accounts Processed</p>
              <p className="text-3xl font-bold text-gray-900">{result?.totalAccounts ?? '—'}</p>
            </div>
            <div className="bg-white rounded p-4">
              <p className="text-gray-600 text-sm mb-1">Arrears Carried Forward</p>
              <p className="text-3xl font-bold text-red-600">{result ? fmt(result.arrearsTotal) : '—'}</p>
            </div>
            <div className="bg-white rounded p-4">
              <p className="text-gray-600 text-sm mb-1">Credits Carried Forward</p>
              <p className="text-3xl font-bold text-purple-600">{result ? fmt(result.creditsTotal) : '—'}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setCompleted(false)
                setResult(null)
                setProgressLog('')
                setProgress(0)
                setCurrentStep(0)
                setShowConfirm(false)
                runPreflight()
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition"
            >
              Return to End of Term
            </button>
          </div>
        </div>
      </div>
    )
  }

  const termLabel = closingTerm
    ? `Term ${closingTerm.number} — ${closingTerm.year}`
    : 'Loading…'
  const nextTermLabel = openingTerm
    ? `Term ${openingTerm.number} — ${openingTerm.year}`
    : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">End of Term Procedure</h1>
        <p className="text-gray-600">
          {closingTerm
            ? `Close ${termLabel} and open ${nextTermLabel}`
            : 'Loading current term from portal settings…'}
        </p>
      </div>

      {/* Step tracker */}
      <StepTracker currentStep={currentStep} />

      {/* Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <div className="flex gap-3">
          <IconAlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">This action is irreversible</p>
            <p className="text-sm text-amber-800">
              This will permanently close all {termLabel} student accounts. Arrears are recorded as Balance c/d and carried forward as Balance b/d into {nextTermLabel}. Credits carry forward as advance payments. This cannot be undone once confirmed.
            </p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Procedure Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Term</label>
            <input type="text" value={termLabel} disabled className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Term</label>
            <input type="text" value={nextTermLabel} disabled className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Date</label>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded px-4 py-2" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label className="flex items-center">
            <input type="checkbox" defaultChecked disabled className="mr-2" />
            <span className="text-sm text-gray-700">Carry forward arrears as Balance b/d (locked)</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked disabled className="mr-2" />
            <span className="text-sm text-gray-700">Carry forward credits as advance payments (locked)</span>
          </label>
        </div>
      </div>

      {/* ── Pre-flight Summary Stat Cards ── */}
      {preflight === 'loading' && (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {preflight === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">Failed to load pre-flight data from Firestore.</p>
          <button
            onClick={runPreflight}
            className="flex items-center gap-1 text-sm text-red-600 border border-red-300 px-3 py-1.5 rounded hover:bg-red-100 transition"
          >
            <MdRefresh className="text-base" /> Retry
          </button>
        </div>
      )}

      {preflight === 'done' && summary && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalAccounts}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Nil Balance</p>
              <p className="text-2xl font-bold text-green-600">{summary.nilBalance}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">In Arrears</p>
              <p className="text-2xl font-bold text-red-600">{summary.arrearsCount}</p>
              <p className="text-xs text-gray-500 mt-1">{fmt(summary.arrearsTotal)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Credits</p>
              <p className="text-2xl font-bold text-purple-600">{summary.creditsCount}</p>
              <p className="text-xs text-gray-500 mt-1">{fmt(summary.creditsTotal)}</p>
            </div>
          </div>

          {/* Account Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Account Closing Preview
              {preview.length < summary.totalAccounts && ` (Top ${preview.length} by balance)`}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {summary.totalAccounts} account{summary.totalAccounts !== 1 ? 's' : ''} in {termLabel}
            </p>

            {preview.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No fee accounts found for {termLabel}.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Reg No</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Charged</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Paid</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">c/d Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(a => {
                      const isDebit  = a.balanceType === 'debit'
                      const isCredit = a.balanceType === 'credit'
                      return (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600 font-mono text-xs">{a.reg_number || a.id}</td>
                          <td className="py-3 px-4 text-gray-900">{a.studentName || '—'}</td>
                          <td className="py-3 px-4 text-gray-600">{a.class || '—'}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{fmt(a.termFees)}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{fmt(a.totalPaid)}</td>
                          <td className={`py-3 px-4 text-right font-semibold ${isDebit ? 'text-red-600' : isCredit ? 'text-purple-600' : 'text-green-600'}`}>
                            {fmt(a.balance)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded ${
                              isDebit  ? 'bg-red-100 text-red-700' :
                              isCredit ? 'bg-purple-100 text-purple-700' :
                                         'bg-gray-100 text-gray-700'
                            }`}>
                              {isDebit ? 'Debit' : isCredit ? 'Credit' : 'Nil'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {isDebit  ? 'Carry forward as debt → B/d ' + nextTermLabel :
                             isCredit ? 'Carry forward as credit → B/d ' + nextTermLabel :
                                        'Settled — no carry forward'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {summary.totalAccounts > 10 && (
              <p className="text-sm text-gray-500 mt-4">…and {summary.totalAccounts - preview.length} more accounts</p>
            )}
          </div>
        </>
      )}

      {/* Double Entry Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Double Entry Preview</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded p-4">
            <p className="font-semibold text-gray-900 mb-2">Arrears Account</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Closing Entry</p>
                <p className="font-mono">Balance c/d  Cr  $X.XX</p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-gray-400">→</p>
              </div>
              <div>
                <p className="text-gray-600">Opening Entry</p>
                <p className="font-mono">Balance b/d  Dr  $X.XX</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="font-semibold text-gray-900 mb-2">Nil Balance Account</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-mono">Closed at $0</p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-gray-400">→</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-mono">Opens fresh ($0)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 bg-gray-200 text-gray-900 px-6 py-2 rounded font-medium hover:bg-gray-300 transition"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isRunning || preflight !== 'done' || !summary}
        >
          Run End of Term Procedure
        </button>
      </div>

      <ProgressModal isOpen={isRunning} progress={progress} currentLog={progressLog} canClose={completed} />

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm End of Term Procedure"
        message={
          summary
            ? `This will close ${summary.totalAccounts} account${summary.totalAccounts !== 1 ? 's' : ''} for ${termLabel}. ${summary.arrearsCount} account${summary.arrearsCount !== 1 ? 's' : ''} (${fmt(summary.arrearsTotal)}) will carry forward as arrears. This cannot be undone.`
            : 'Are you sure you want to run the end of term procedure? This cannot be undone.'
        }
        confirmText="Confirm and Run"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleRunProcedure}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
