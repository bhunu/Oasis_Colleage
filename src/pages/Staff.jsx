import { useState } from 'react'
import { motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import StaffCard from '../components/StaffCard'
import { useStaff } from '../hooks/useStaff'
import { DEPARTMENTS } from '../constants/departments'
import { FaUsers } from 'react-icons/fa'

export default function Staff() {
  const { staff, loading, getFeatured, getByDepartment } = useStaff()
  const [activeDept, setActiveDept] = useState('All')

  const featuredStaff  = getFeatured()
  const filteredStaff  = getByDepartment(activeDept)
  const presentDepts   = ['All', ...DEPARTMENTS.filter(d => staff.some(m => m.department === d))]

  return (
    <>
      <PageHero
        title="Our Team"
        subtitle="Meet the dedicated educators shaping tomorrow's leaders at Oasis Private College."
        breadcrumb={[{ label: 'Our Team' }]}
        image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80"
      />

      {/* FEATURED LEADERSHIP */}
      {!loading && featuredStaff.length > 0 && (
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

      {/* ALL STAFF */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle
            label="Our Educators"
            title="Meet the Full Team"
            subtitle={loading ? 'Loading staff…' : `${staff.length} dedicated professionals shaping the future of education in Checheche.`}
          />

          {/* Department filter tabs */}
          {!loading && (
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
          )}

          {/* Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="h-52 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
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
    </>
  )
}
