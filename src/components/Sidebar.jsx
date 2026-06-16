import { NavLink, useNavigate } from 'react-router-dom'
import { FaGraduationCap } from 'react-icons/fa'
import {
  MdDashboard as IconDashboard,
  MdPersonAdd as IconUserPlus,
  MdPeople as IconUsers,
  MdEmojiEvents as IconFileCertificate,
  MdAnalytics as IconReportAnalytics,
  MdSettings as IconSettings,
  MdLogout as IconLogout,
  MdBook as IconBook,
  MdExitToApp as IconExeat,
  MdVerifiedUser as IconClearance,
  MdLeaderboard as IconLeaderboard,
  MdClass as IconClass,
  MdGrade as IconGrade,
  MdEmojiEvents as IconPrize,
  MdCalendarToday as IconTimetable,
  MdEventNote as IconExamTimetable,
} from 'react-icons/md'
import toast from 'react-hot-toast'

const NAV = [
  {
    section: 'OVERVIEW',
    items: [{ label: 'Dashboard', icon: IconDashboard, path: '/dashboard' }],
  },
  {
    section: 'STUDENTS',
    items: [
      { label: 'Enrol students',  icon: IconUserPlus,  path: '/enrol' },
      { label: 'Student records', icon: IconUsers,     path: '/students' },
      { label: 'Classes',         icon: IconClass,     path: '/classes' },
      { label: 'Clearance',       icon: IconClearance, path: '/clearance' },
      { label: 'Exeat Passes',    icon: IconExeat,     path: '/exeat' },
    ],
  },
  {
    section: 'ACADEMICS',
    items: [
      { label: 'Subjects',           icon: IconBook,            path: '/subjects' },
      { label: 'End of term exams',  icon: IconFileCertificate, path: '/exams' },
      { label: 'Academic reports',   icon: IconReportAnalytics, path: '/reports' },
      { label: 'Class Performance',  icon: IconLeaderboard,     path: '/class-performance' },
      { label: 'Prize Giving',       icon: IconPrize,           path: '/prize-giving' },
      { label: 'Grade Settings',     icon: IconGrade,           path: '/grade-settings' },
      { label: 'Timetables',          icon: IconTimetable,        path: '/timetable' },
      { label: 'Exam Timetable',     icon: IconExamTimetable,    path: '/exam-timetable' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Settings',    icon: IconSettings, path: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('studentsAdminSession')
    toast.success('Logged out')
    setTimeout(() => navigate('/'), 400)
  }

  return (
    <aside className="w-60 bg-[#0D1C35] border-r border-white/10 fixed left-0 top-0 h-full flex flex-col z-30 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0">
          <FaGraduationCap className="text-[#0A1628] text-lg" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight font-playfair">Oasis College</p>
          <p className="text-[10px] text-[#C9A84C]/70 uppercase tracking-wider font-montserrat">Student Records</p>
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
                    end={item.path === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-montserrat transition-all border-l-2 pl-[10px] ${
                        isActive
                          ? 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`text-lg shrink-0 ${isActive ? 'text-[#C9A84C]' : 'text-gray-500'}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-amber-500/20 text-amber-400 text-[9px] font-bold font-montserrat px-1.5 py-0.5 rounded-full">
                            {item.badge}
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
          <IconLogout className="text-lg text-gray-500 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}
