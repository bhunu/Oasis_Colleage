import { useState } from 'react'
import { MdWarning as IconAlertTriangle } from 'react-icons/md'
import StepTracker from '../components/StepTracker'
import ProgressModal from '../components/ProgressModal'
import ConfirmModal from '../components/ConfirmModal'
import { runEndOfTermProcedure } from '../utils/runEndOfTermProcedure'
import toast from 'react-hot-toast'

const mockSummary = {
  totalAccounts: 248,
  nilBalance: 198,
  arrearsCount: 50,
  arrearsTotal: 24300,
  creditsCount: 0,
  creditsTotal: 0,
}

const mockAccountsPreview = [
  { id: 'OC-2024-0142', name: 'Blessing Ncube', class: '2B', charged: 800, paid: 180, balance: 620, type: 'debit' },
  { id: 'OC-2024-0128', name: 'Grace Moyo', class: '3B', charged: 800, paid: 800, balance: 0, type: 'nil' },
  { id: 'OC-2024-0145', name: 'Samuel Mwale', class: '2A', charged: 800, paid: 0, balance: 800, type: 'debit' },
  { id: 'OC-2024-0156', name: 'David Chikombo', class: '1A', charged: 800, paid: 400, balance: 400, type: 'debit' },
  { id: 'OC-2024-0189', name: 'Joyce Banda', class: '3A', charged: 800, paid: 680, balance: 120, type: 'debit' },
  { id: 'OC-2024-0201', name: 'Peter Mutoro', class: '2A', charged: 800, paid: 800, balance: 0, type: 'nil' },
  { id: 'OC-2024-0215', name: 'Amelia Kinyua', class: '1B', charged: 800, paid: 250, balance: 550, type: 'debit' },
  { id: 'OC-2024-0230', name: 'Wilson Kabuka', class: '3B', charged: 800, paid: 800, balance: 0, type: 'nil' },
  { id: 'OC-2024-0242', name: 'Zainab Hassan', class: '2B', charged: 800, paid: 100, balance: 700, type: 'debit' },
  { id: 'OC-2024-0258', name: 'Marcus Okonkwo', class: '4A', charged: 800, paid: 800, balance: 0, type: 'nil' },
]

export default function EndOfTerm() {
  const [closingTerm] = useState({ number: 2, year: 2025 })
  const [openingTerm] = useState({ number: 3, year: 2025 })
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [progressLog, setProgressLog] = useState('')
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)

  const handleProgressUpdate = (data) => {
    setCurrentStep(data.step - 1)
    setProgress(data.progress)
    setProgressLog(data.log)
  }

  const handleRunProcedure = async () => {
    setShowConfirm(false)
    setIsRunning(true)

    try {
      const result = await runEndOfTermProcedure(closingTerm, openingTerm, 'admin@oasis.edu', handleProgressUpdate)

      setCompleted(true)
      toast.success('End of term procedure completed!')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to run procedure')
      setIsRunning(false)
    }
  }

  if (completed) {
    return (
      <div className="max-w-4xl">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Procedure Completed</h3>
          <p className="text-gray-700 mb-6">Term 2 — 2025 has been successfully closed</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded p-4">
              <p className="text-gray-600 text-sm mb-1">Accounts Processed</p>
              <p className="text-3xl font-bold text-gray-900">248</p>
            </div>
            <div className="bg-white rounded p-4">
              <p className="text-gray-600 text-sm mb-1">Arrears Carried</p>
              <p className="text-3xl font-bold text-red-600">$24,300</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition">
              Download Closing Report
            </button>
            <button className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 transition">
              View Term 3 Accounts
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">End of Term Procedure</h1>
        <p className="text-gray-600">Close Term 2 — 2025 and open Term 3 — 2025</p>
      </div>

      {/* Progress Tracker */}
      <StepTracker currentStep={currentStep} />

      {/* Warning Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <div className="flex gap-3">
          <IconAlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">This action is irreversible</p>
            <p className="text-sm text-amber-800">
              This action will permanently close all Term 2 — 2025 student accounts. Arrears recorded as Balance c/d and carried forward as Balance b/d into Term 3 — 2025. Credits carry forward as advance payments. This cannot be undone once confirmed.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Procedure Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Term</label>
            <input type="text" value={`Term ${closingTerm.number} — ${closingTerm.year}`} disabled className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Term</label>
            <input type="text" value={`Term ${openingTerm.number} — ${openingTerm.year}`} disabled className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-50" />
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
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm text-gray-700">Generate closing statements for all students</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm text-gray-700">Notify student portal of updated balances</span>
          </label>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Total Accounts</p>
          <p className="text-2xl font-bold text-gray-900">{mockSummary.totalAccounts}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Nil Balance</p>
          <p className="text-2xl font-bold text-green-600">{mockSummary.nilBalance}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">In Arrears</p>
          <p className="text-2xl font-bold text-red-600">{mockSummary.arrearsCount}</p>
          <p className="text-xs text-gray-500 mt-1">${mockSummary.arrearsTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Credits</p>
          <p className="text-2xl font-bold text-purple-600">{mockSummary.creditsCount}</p>
          <p className="text-xs text-gray-500 mt-1">${mockSummary.creditsTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Account Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Closing Preview (First 10)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student ID</th>
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
              {mockAccountsPreview.map((account) => (
                <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">{account.id}</td>
                  <td className="py-3 px-4 text-gray-900">{account.name}</td>
                  <td className="py-3 px-4 text-gray-600">{account.class}</td>
                  <td className="py-3 px-4 text-right text-gray-600">${account.charged.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">${account.paid.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${account.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                    ${account.balance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        account.type === 'debit' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {account.type === 'debit' ? 'Debit' : 'Nil'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {account.type === 'debit' ? 'Carry forward as debt → B/d Term 3' : 'Settled — no carry forward'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600 mt-4">...and 238 more accounts</p>
      </div>

      {/* Double Entry Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Double Entry Preview</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded p-4">
            <p className="font-semibold text-gray-900 mb-2">Sample 1: Arrears Account</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Closing Entry</p>
                <p className="font-mono">Balance c/d Cr $620</p>
              </div>
              <div className="flex items-center justify-center">
                <p className="text-gray-400">→</p>
              </div>
              <div>
                <p className="text-gray-600">Opening Entry</p>
                <p className="font-mono">Balance b/d Dr $620</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-4">
            <p className="font-semibold text-gray-900 mb-2">Sample 2: Nil Balance Account</p>
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
        <button className="flex-1 bg-gray-200 text-gray-900 px-6 py-2 rounded font-medium hover:bg-gray-300 transition">
          Cancel
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isRunning}
        >
          Run End of Term Procedure
        </button>
      </div>

      <ProgressModal isOpen={isRunning} progress={progress} currentLog={progressLog} canClose={completed} />

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm End of Term Procedure"
        message={`Are you sure? This will close ${mockSummary.totalAccounts} accounts and cannot be undone.`}
        confirmText="Confirm and Run"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleRunProcedure}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
