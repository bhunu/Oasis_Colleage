import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/config'
import LedgerTable from '../components/LedgerTable'

const mockLedgerEntries = [
  { date: '2025-04-01', description: 'Term fees opening', debit: 800, credit: 0, balance: 800 },
  { date: '2025-04-15', description: 'Payment - Bank Transfer', debit: 0, credit: 180, balance: 620 },
  { date: '2025-05-28', description: 'Balance c/d', debit: 0, credit: 0, balance: 620 },
]

export default function StudentPortal() {
  const [user] = useAuthState(auth)
  const [currentBalance] = useState(620)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Account</h2>
            <p className="text-gray-600">View your fees and payment history</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
            <p className={`text-3xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${currentBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <LedgerTable ledgerEntries={mockLedgerEntries} studentName={user?.displayName || 'Student'} currentBalance={currentBalance} />
    </div>
  )
}
