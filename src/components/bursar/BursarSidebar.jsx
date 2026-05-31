import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  MdDashboard,
  MdPointOfSale,
  MdReceipt,
  MdPeople,
  MdWarning,
  MdPieChart,
  MdDescription,
  MdCategory,
  MdAttachMoney,
  MdBalance,
  MdTableChart,
  MdPrint,
  MdSettings,
  MdLogout,
  MdAccountBalance,
} from 'react-icons/md'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import toast from 'react-hot-toast'

const TEAL = '#0F6E56'

const NAV = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: MdDashboard, path: '/bursar/dashboard' },
    ],
  },
  {
    section: 'FEE COLLECTIONS',
    items: [
      { label: 'Receive payment',   icon: MdPointOfSale, path: '/bursar/receive-payment' },
      { label: 'Issue receipt',     icon: MdReceipt,     path: '/bursar/issue-receipt' },
      { label: 'Student accounts',  icon: MdPeople,      path: '/bursar/student-accounts' },
      { label: 'Arrears',           icon: MdWarning,     path: '/bursar/arrears', badge: true },
    ],
  },
  {
    section: 'BUDGET & EXPENSES',
    items: [
      { label: 'Budget overview',       icon: MdPieChart,     path: '/bursar/budget' },
      { label: 'Record expense',        icon: MdDescription,  path: '/bursar/record-expense' },
      { label: 'Expense categories',    icon: MdCategory,     path: '/bursar/expense-categories' },
    ],
  },
  {
    section: 'FINANCIAL REPORTS',
    items: [
      { label: 'Income statement',      icon: MdAttachMoney,  path: '/bursar/income-statement' },
      { label: 'Balance sheet',         icon: MdBalance,      path: '/bursar/balance-sheet' },
      { label: 'Fee collection report', icon: MdTableChart,   path: '/bursar/collection-report' },
      { label: 'Print reports',         icon: MdPrint,        path: '/bursar/print-reports' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Settings', icon: MdSettings, path: '/bursar/settings' },
    ],
  },
]

export default function BursarSidebar({ open, onClose }) {
  const navigate = useNavigate()
  const [arrearsCount, setArrearsCount] = useState(0)

  useEffect(() => {
    getDocs(query(collection(db, 'feeAccounts'), where('balanceType', '==', 'debit')))
      .then(snap => setArrearsCount(snap.size))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('bursarSession')
    toast.success('Logged out')
    setTimeout(() => navigate('/'), 400)
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-[210px] bg-[#0D1C35] border-r border-white/10
        flex flex-col z-30 transition-transform duration-300 overflow-y-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: TEAL }}>
            <MdAccountBalance className="text-white text-lg" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight font-playfair">Oasis College</p>
            <p className="text-[10px] uppercase tracking-wider font-montserrat" style={{ color: `${TEAL}` }}>
              School Bursar
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          {NAV.map((section, idx) => (
            <div key={idx} className="mb-5">
              <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-2 px-3 font-montserrat">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/bursar/dashboard'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] ${
                          isActive
                            ? 'border-[#0F6E56] text-[#0F6E56] bg-[#0F6E56]/10'
                            : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className="text-lg shrink-0"
                            style={{ color: isActive ? TEAL : undefined }}
                          />
                          <span className="flex-1 text-xs">{item.label}</span>
                          {item.badge && arrearsCount > 0 && (
                            <span className="ml-auto bg-red-500/80 text-white text-[9px] font-bold font-montserrat px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                              {arrearsCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all w-full border-l-2 border-transparent pl-[10px]"
          >
            <MdLogout className="text-lg text-gray-500 shrink-0" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
