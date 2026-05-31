import { useNavigate } from 'react-router-dom'
import { MdPrint, MdAttachMoney, MdBalance, MdTableChart, MdPieChart } from 'react-icons/md'

const TEAL = '#0F6E56'
const CARD = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

const REPORTS = [
  {
    title: 'Income Statement',
    desc:  'Revenue, expenses and net surplus for the selected term',
    icon:  MdAttachMoney,
    path:  '/bursar/income-statement',
    color: TEAL,
  },
  {
    title: 'Balance Sheet',
    desc:  'Assets, liabilities and net financial position',
    icon:  MdBalance,
    path:  '/bursar/balance-sheet',
    color: '#378ADD',
  },
  {
    title: 'Fee Collection Report',
    desc:  'Detailed receipts, monthly collections and payment methods',
    icon:  MdTableChart,
    path:  '/bursar/collection-report',
    color: '#EF9F27',
  },
  {
    title: 'Budget Overview',
    desc:  'Budget allocations vs actual spending by category',
    icon:  MdPieChart,
    path:  '/bursar/budget',
    color: '#7F77DD',
  },
]

export default function PrintReports() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-1">Print & Export Reports</h3>
        <p className="text-sm text-gray-500 font-montserrat mb-6">
          Select a report to view, print, or export as CSV.
          All reports use the latest data from Firestore.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REPORTS.map(r => {
            const Icon = r.icon
            return (
              <div
                key={r.title}
                className="border border-white/10 rounded-xl p-5 hover:border-[#0F6E56]/40 hover:bg-[#0F6E56]/5 transition cursor-pointer group"
                onClick={() => navigate(r.path)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: `${r.color}22`, color: r.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white font-montserrat text-sm group-hover:text-[#1D9E75] transition-colors">{r.title}</p>
                    <p className="text-xs text-gray-500 font-montserrat mt-0.5 leading-relaxed">{r.desc}</p>
                  </div>
                  <MdPrint className="text-gray-600 group-hover:text-[#1D9E75] transition-colors text-lg" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-3">Quick Print Tips</h3>
        <ul className="space-y-2 text-sm text-gray-400 font-montserrat list-disc list-inside">
          <li>Open a report and use the <strong className="text-white">Print</strong> button for a print-friendly layout.</li>
          <li>Use <strong className="text-white">Export CSV</strong> to download data for Excel or Google Sheets.</li>
          <li>For PDF, use your browser's built-in "Save as PDF" print option.</li>
        </ul>
      </div>
    </div>
  )
}
