import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import StaffCard from '../components/StaffCard'
import StaffAdminPanel from '../components/StaffAdminPanel'
import AdminPIN from '../components/AdminPIN'
import Toast from '../components/Toast'
import { useStaff } from '../hooks/useStaff'
import { usePIN } from '../hooks/usePIN'
import { DEPARTMENTS, DEPT_STYLES } from '../constants/departments'
import { FaUsers, FaChevronDown } from 'react-icons/fa'

export default function Staff() {
  const { staff, addStaff, updateStaff, deleteStaff, reorderStaff, getFeatured, getByDepartment } = useStaff()
  const { unlocked } = usePIN()
  const [activeDept, setActiveDept] = useState('All')
  const [toast, setToast] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)

  const featuredStaff = getFeatured()
  const filteredStaff = getByDepartment(activeDept)
  const presentDepts = ['All', ...DEPARTMENTS.filter(d => staff.some(m => m.department === d))]

  return (
    <>
      <PageHero
        title="Our Team"
        subtitle="Meet the dedicated educators shaping tomorrow's leaders at Oasis Private College."
        breadcrumb={[{ label: 'Our Team' }]}
        image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80"
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── FEATURED LEADERSHIP ─────────────────────────────────── */}
      {featuredStaff.length > 0 && (
        <section className="section-padding bg-navy">
          <div className="container-max">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-3">
                  School Leadership
                </span>
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">Leadership Team</h2>
                <span className="block mt-4 w-16 h-1 bg-gold rounded-full" />
              </div>
              <p className="text-gray-400 text-sm max-w-xs">
                The experienced educators guiding Oasis Private College toward its vision of excellence.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStaff.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <StaffCard {...member} size="lg" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ALL STAFF ───────────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle
            label="Our Educators"
            title="Meet the Full Team"
            subtitle={`${staff.length} dedicated professionals shaping the future of education in Checheche.`}
          />

          {/* Department filter tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {presentDepts.map(dept => {
              const count = dept === 'All' ? staff.length : staff.filter(m => m.department === dept).length
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-200 ${
                    activeDept === dept
                      ? 'bg-navy text-white shadow-lg'
                      : 'bg-white text-slate hover:bg-gold/10 hover:text-navy border border-gray-200'
                  }`}
                >
                  {dept}{dept !== 'All' ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>

          {/* Staff grid */}
          {filteredStaff.length === 0 ? (
            <div className="text-center py-20 text-slate-light">
              <FaUsers className="text-5xl mx-auto mb-4 opacity-30" />
              <p>No staff members in this department yet.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStaff.map((member, i) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <StaffCard {...member} size="md" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── ADMIN ───────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container-max">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <AdminPIN />
            {unlocked && (
              <button
                onClick={() => setShowAdmin(v => !v)}
                className="flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
              >
                <FaUsers className="text-sm" />
                {showAdmin ? 'Close Panel' : 'Manage Staff'}
                <FaChevronDown className={`text-xs transition-transform duration-300 ${showAdmin ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {unlocked && showAdmin && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <StaffAdminPanel
                  staff={staff}
                  addStaff={addStaff}
                  updateStaff={updateStaff}
                  deleteStaff={deleteStaff}
                  reorderStaff={reorderStaff}
                  onToast={setToast}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
