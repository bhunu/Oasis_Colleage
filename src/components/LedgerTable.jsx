export default function LedgerTable({ ledgerEntries, studentName, currentBalance }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{studentName}</h3>
          <p className="text-sm text-gray-600">Account Ledger</p>
        </div>
        <div className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {currentBalance > 0 ? '-' : ''}${Math.abs(currentBalance).toFixed(2)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Debit</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Credit</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries && ledgerEntries.length > 0 ? (
              ledgerEntries.map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">{entry.date}</td>
                  <td className="py-3 px-4 text-gray-900">{entry.description}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{entry.debit ? `$${entry.debit.toFixed(2)}` : '-'}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{entry.credit ? `$${entry.credit.toFixed(2)}` : '-'}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${entry.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${entry.balance.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-6 text-center text-gray-500">
                  No ledger entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
