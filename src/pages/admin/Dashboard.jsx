import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdArticle, MdEvent, MdPeople, MdPhotoLibrary, MdKey, MdPerson } from 'react-icons/md'
import StatCard from '../../components/admin/StatCard'
import { getNews } from '../../firebase/news'
import { getCalendarEvents } from '../../firebase/calendarEvents'
import { getAdminStaff } from '../../firebase/staffAdmin'
import { getGallery } from '../../firebase/gallery'
import { useLicense } from '../../license/LicenseContext'

const PLAN_MAX = { 'premium-s': 150, 'premium-m': 300, 'premium-l': 500 }

export default function Dashboard() {
  const navigate = useNavigate()
  const { hasFeature, licenseData } = useLicense()
  // fall back to plan-derived limit for tokens generated before maxStudents was added
  const maxStudents = licenseData?.maxStudents ?? PLAN_MAX[licenseData?.plan] ?? null

  // Feature flags — match the same rules used in AdminSidebar
  const hasStudentPortal    = hasFeature('student-portal')
  const hasPortalSettings   = hasFeature('student-records') || hasFeature('student-portal')
  const hasAnyPortal        = ['student-records', 'student-portal', 'teacher-portal', 'bursar'].some(f => hasFeature(f))
  const hasAnyQuickAction   = hasStudentPortal || hasAnyPortal || hasPortalSettings

  const [counts, setCounts]             = useState({ news: 0, events: 0, staff: 0, gallery: 0 })
  const [portalCounts, setPortalCounts] = useState({ active: 0, pending: 0, expired: 0 })
  const [recentNews, setRecentNews]     = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading]           = useState(true)
  const [portalLoading, setPortalLoading] = useState(true)
  const [studentCount, setStudentCount] = useState(null)

  useEffect(() => {
    Promise.all([getNews(), getCalendarEvents(), getAdminStaff(), getGallery()])
      .then(([news, events, staff, gallery]) => {
        setCounts({ news: news.length, events: events.length, staff: staff.length, gallery: gallery.length })
        setRecentNews(news.slice(0, 5))
        const today = new Date().toISOString().slice(0, 10)
        setUpcomingEvents(events.filter(e => e.date >= today).slice(0, 5))
      })
      .finally(() => setLoading(false))

    if (maxStudents != null && licenseData?.plan !== 'basic') {
      getDocs(collection(db, 'students'))
        .then(snap => setStudentCount(snap.size))
        .catch(() => {})
    }

    if (!hasStudentPortal) { setPortalLoading(false); return }

    const now = new Date()
    getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
      .then(snap => {
        let active = 0, pending = 0, expired = 0
        snap.docs.forEach(d => {
          const u = d.data()
          if (u.hasSetupPassword) {
            active++
          } else if (u.otpCode && !u.otpUsed) {
            const exp = u.otpExpiresAt
            const expDate = exp?.toDate ? exp.toDate() : exp ? new Date(exp) : null
            if (expDate && expDate > now) pending++
            else expired++
          }
        })
        setPortalCounts({ active, pending, expired })
      })
      .catch(() => {})
      .finally(() => setPortalLoading(false))
  }, [hasStudentPortal, maxStudents, licenseData?.plan])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="News Articles"  value={counts.news}    icon={MdArticle}      color="blue"   loading={loading} />
        <StatCard label="Events"         value={counts.events}  icon={MdEvent}        color="green"  loading={loading} />
        <StatCard label="Staff Members"  value={counts.staff}   icon={MdPeople}       color="purple" loading={loading} />
        <StatCard label="Gallery Photos" value={counts.gallery} icon={MdPhotoLibrary} color="amber"  loading={loading} />
        {hasAnyPortal && (
          <StatCard label="Portal Users" value={portalCounts.active} icon={MdPerson} color="green" loading={portalLoading} />
        )}
        {hasStudentPortal && (
          <div
            onClick={() => navigate('/admin/student-otp')}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <StatCard
              label="Pending OTPs"
              value={portalCounts.pending}
              icon={MdKey}
              color="amber"
              loading={portalLoading}
            />
            {!portalLoading && portalCounts.expired > 0 && (
              <p className="text-[10px] font-montserrat text-gray-600 mt-1 pl-1">
                {portalCounts.expired} expired · click to manage
              </p>
            )}
          </div>
        )}
      </div>

      {/* Student usage bar — only for capped premium plans, never Basic */}
      {maxStudents != null && licenseData?.plan !== 'basic' && (
        (() => {
          const used    = studentCount ?? 0
          const pct     = Math.min(100, Math.round((used / maxStudents) * 100))
          const barCls  = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
          const textCls = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400'
          return (
            <div className="bg-navy-light rounded-xl border border-white/10 px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-300 font-montserrat">Student Enrolment</p>
                  <span className={`text-xs font-bold font-montserrat ${textCls}`}>
                    {studentCount == null ? '…' : used} / {maxStudents.toLocaleString()}
                  </span>
                </div>
                {pct >= 80 && (
                  <a
                    href="/admin/license"
                    className="text-[10px] font-semibold font-montserrat text-gold hover:text-[#d4b05a] transition-colors"
                  >
                    Upgrade plan →
                  </a>
                )}
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                  style={{ width: studentCount == null ? '0%' : `${pct}%` }}
                />
              </div>
              {pct >= 90 && (
                <p className="text-[10px] font-montserrat text-red-400 mt-1.5">
                  Limit almost reached — upgrade to enrol more students.
                </p>
              )}
            </div>
          )
        })()
      )}

      {/* Quick actions — only shown when at least one action is available */}
      {hasAnyQuickAction && (
        <div className="bg-navy-light rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-bold text-white font-playfair mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {hasStudentPortal && (
              <button
                onClick={() => navigate('/admin/student-otp')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-navy transition hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary-hex)' }}
              >
                <MdKey className="text-base" />
                Student OTP
              </button>
            )}
            {hasAnyPortal && (
              <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <MdPeople className="text-base" />
                User Management
              </button>
            )}
            {hasPortalSettings && (
              <button
                onClick={() => navigate('/admin/portal-settings')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                Portal Settings
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent News */}
        <div className="bg-navy-light rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-bold text-white font-playfair mb-4">Recent News</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />)}
            </div>
          ) : recentNews.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center font-montserrat">No news articles yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentNews.map(n => (
                <li key={n.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-gold shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 font-medium font-montserrat truncate">{n.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-montserrat">{n.category ?? 'General'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-navy-light rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-bold text-white font-playfair mb-4">Upcoming Events</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />)}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center font-montserrat">No upcoming events.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map(e => {
                const d = new Date(e.date + 'T00:00')
                return (
                  <li key={e.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-gold uppercase leading-none font-montserrat">
                        {d.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold text-gold leading-none font-playfair">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 font-medium font-montserrat truncate">{e.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-montserrat">{e.location ?? ''}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
