import { useState } from 'react'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import PaymentModal from '../components/PaymentModal'
import toast from 'react-hot-toast'

export default function Fees() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const mockAccounts = [
    {
      id: 'OC-2024-0142',
      name: 'Blessing Ncube',
      class: 'Form 2B',
      term: 'Term 2 — 2025',
      charged: 800,
      paid: 180,
      balance: 620,
      balanceType: 'debit',
    },
    {
      id: 'OC-2024-0128',
      name: 'Grace Moyo',
      class: 'Form 3B',
      term: 'Term 2 — 2025',
      charged: 800,
      paid: 800,
      balance: 0,
      balanceType: 'nil',
    },
    {
      id: 'OC-2024-0145',
      name: 'Samuel Mwale',
      class: 'Form 2A',
      term: 'Term 2 — 2025',
      charged: 800,
      paid: 0,
      balance: 800,
      balanceType: 'debit',
    },
  ]

  const filteredAccounts = mockAccounts.filter(
    (acc) => acc.id.toLowerCase().includes(searchTerm.toLowerCase()) || acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPayment = async (paymentData) => {
    setLoading(true)
    try {
      // Update fee account
      toast.success('Payment recorded successfully')
      setPaymentModal(false)
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <input
          type="text"
          placeholder="Search by student name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
      </div>

      {/* Account Details */}
      {selectedAccount && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedAccount.name}</h3>
              <p className="text-gray-600">{selectedAccount.id} • {selectedAccount.class} • {selectedAccount.term}</p>
            </div>
            <div
              className={`text-3xl font-bold ${
                selectedAccount.balance > 0
                  ? 'text-red-600'
                  : selectedAccount.balance < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
              }`}
            >
              {selectedAccount.balance > 0 ? '-' : ''}${Math.abs(selectedAccount.balance).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded p-4">
              <p className="text-xs text-gray-600 mb-1">Fees Charged</p>
              <p className="text-2xl font-bold text-blue-600">${selectedAccount.charged.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 rounded p-4">
              <p className="text-xs text-gray-600 mb-1">Fees Paid</p>
              <p className="text-2xl font-bold text-green-600">${selectedAccount.paid.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-xs text-gray-600 mb-1">Balance Type</p>
              <p className={`text-lg font-bold ${selectedAccount.balanceType === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                {selectedAccount.balanceType === 'debit' ? 'In Arrears' : 'Nil'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPaymentModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition"
            >
              Add Payment
            </button>
            <button className="bg-gray-200 text-gray-900 px-6 py-2 rounded font-medium hover:bg-gray-300 transition">
              Add Charge
            </button>
            <button onClick={() => setSelectedAccount(null)} className="bg-gray-200 text-gray-900 px-6 py-2 rounded font-medium hover:bg-gray-300 transition">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {!selectedAccount && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Fee Accounts</h3>
          <div className="space-y-3">
            {filteredAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className="w-full text-left border border-gray-200 rounded p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-600">
                      {account.id} • {account.class}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${account.balance > 0 ? 'text-red-600' : account.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {account.balance > 0 ? '-' : ''}${Math.abs(account.balance).toFixed(2)}
                    </p>
                    <p
                      className={`text-xs px-2 py-1 rounded ${
                        account.balanceType === 'debit'
                          ? 'bg-red-100 text-red-700'
                          : account.balanceType === 'credit'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {account.balanceType === 'debit' ? 'In Arrears' : 'Nil'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        onSave={handleAddPayment}
        studentId={selectedAccount?.id}
        studentName={selectedAccount?.name}
      />
    </div>
  )
}
