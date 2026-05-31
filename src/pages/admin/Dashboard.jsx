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

export default function Dashboard() {
  const navigate = useNavigate()
  const [counts, setCounts]           = useState({ news: 0, events: 0, staff: 0, gallery: 0 })
  const [portalCounts, setPortalCounts] = useState({ active: 0, pending: 0, expired: 0 })
  const [recentNews, setRecentNews]   = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [loading, setLoading]         = useState(true)
  const [portalLoading, setPortalLoading] = useState(true)

  useEffect(() => {
    Promise.all([getNews(), getCalendarEvents(), getAdminStaff(), getGallery()])
      .then(([news, events, staff, gallery]) => {
        setCounts({ news: news.length, events: events.length, staff: staff.length, gallery: gallery.length })
        setRecentNews(news.slice(0, 5))
        const today = new Date().toISOString().slice(0, 10)
        setUpcomingEvents(events.filter(e => e.date >= today).slice(0, 5))
      })
      .finally(() => setLoading(false))

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
  }, [])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="News Articles"  value={counts.news}    icon={MdArticle}      color="blue"   loading={loading} />
        <StatCard label="Events"         value={counts.events}  icon={MdEvent}        color="green"  loading={loading} />
        <StatCard label="Staff Members"  value={counts.staff}   icon={MdPeople}       color="purple" loading={loading} />
        <StatCard label="Gallery Photos" value={counts.gallery} icon={MdPhotoLibrary} color="amber"  loading={loading} />
        <StatCard label="Portal Users"   value={portalCounts.active}  icon={MdPerson} color="green"  loading={portalLoading} />
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
      </div>

      {/* Quick actions */}
      <div className="bg-[#132140] rounded-xl border border-white/10 p-5">
        <h2 className="text-sm font-bold text-white font-playfair mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/student-otp')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-[#0A1628] transition hover:opacity-90"
            style={{ backgroundColor: '#C9A84C' }}
          >
            <MdKey className="text-base" />
            Student OTP
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <MdPeople className="text-base" />
            User Management
          </button>
          <button
            onClick={() => navigate('/admin/portal-settings')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-montserrat text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            Portal Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent News */}
        <div className="bg-[#132140] rounded-xl border border-white/10 p-5">
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
                  <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#C9A84C] shrink-0" />
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
        <div className="bg-[#132140] rounded-xl border border-white/10 p-5">
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
                    <div className="w-9 h-9 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-[#C9A84C] uppercase leading-none font-montserrat">
                        {d.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold text-[#C9A84C] leading-none font-playfair">{d.getDate()}</span>
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
