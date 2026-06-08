import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import heroImg from '../assets/hero1.jpg'
import hero2Img from '../assets/hero2.jpg'
import oasisImg from '../assets/oasis.jpg'
import studentsImg from '../assets/our students.jpg'
import classroomImg from '../assets/classroom setup.jpg'
import soccerImg from '../assets/soccer team.jpg'
import {
  FaBookOpen, FaFlask, FaUsers, FaChartLine,
  FaFutbol, FaBasketballBall, FaRunning, FaTheaterMasks, FaMusic, FaComments,
  FaTrophy, FaMedal,
  FaArrowDown, FaChevronRight,
} from 'react-icons/fa'
import StatCounter from '../components/StatCounter'
import SectionTitle from '../components/SectionTitle'
import TestimonialCard from '../components/TestimonialCard'
import ProgramCard from '../components/ProgramCard'
import { useCalendar } from '../hooks/useCalendar'
import { useGallery } from '../hooks/useGallery'
import { useStaff } from '../hooks/useStaff'
import StaffCard from '../components/StaffCard'

const stagger = { animate: { transition: { staggerChildren: 0.12 } } }
const fadeUp  = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const PROGRAMS = [
  { icon: FaBookOpen, title: 'Cambridge O-Level', description: 'Rigorous IGCSE and O-Level programmes preparing students for university entry with a broad curriculum spanning Sciences, Humanities, Commerce and the Arts.', subjects: ['English', 'Mathematics', 'Sciences', 'History'] },
  { icon: FaChartLine, title: 'Cambridge A-Level', description: 'Advanced Level studies with focused depth in chosen subjects. Our A-Level students consistently achieve outstanding results and gain entry to top universities.', subjects: ['Sciences', 'Commerce', 'Humanities', 'Languages'] },
  { icon: FaFlask,    title: 'STEM & Sciences',  description: 'State-of-the-art laboratories and dedicated STEM teachers inspire curiosity and critical thinking. Practical investigation is at the core of every science lesson.', subjects: ['Biology', 'Chemistry', 'Physics', 'Computing'] },
  { icon: FaUsers,   title: 'Arts & Commerce',  description: 'From Accounts to Fine Art, our Arts and Commerce stream develops creative thinkers and future business leaders through real-world application.', subjects: ['Accounts', 'Business', 'Art', 'Literature'] },
]

const FEATURES = [
  {
    title: 'World-Class Facilities',
    body: 'Our campus features fully equipped science laboratories, a modern computer lab, a well-stocked library, dedicated art and music rooms, and expansive sports fields — all designed to inspire learning and growth.',
    image: classroomImg,
  },
  {
    title: 'Expert & Dedicated Faculty',
    body: 'Every teacher at Oasis Private College is a qualified, passionate professional committed to each student\'s success. Small class sizes ensure personalised attention and meaningful teacher-student relationships.',
    image: oasisImg,
  },
  {
    title: 'Vibrant Day School Community',
    body: 'As a day school, students bring the energy of home into every day at Oasis. From morning assembly to after-school activities, every day is rich with sport, culture, debate, music, and peer connection.',
    image: studentsImg,
  },
]

const SPORTS_CULTURE = [
  { icon: FaFutbol,         label: 'Football',      teal: false },
  { icon: FaBasketballBall, label: 'Netball',        teal: false },
  { icon: FaRunning,        label: 'Athletics',      teal: false },
  { icon: FaTrophy,         label: 'Sports Events',  teal: true  },
  { icon: FaMedal,          label: 'Tournaments',    teal: true  },
  { icon: FaTheaterMasks,   label: 'Drama',          teal: false },
  { icon: FaMusic,          label: 'Music',          teal: false },
  { icon: FaComments,       label: 'Debate',         teal: false },
]

const TESTIMONIALS = [
  {
    quote: "Oasis Private College gave my daughter more than an education — it gave her confidence, discipline, and a love of learning. The teachers genuinely care about every child's future.",
    name: 'Mrs. Tendai Mutasa',
    role: 'Parent · Form 4 Student',
  },
  {
    quote: "The O-Level results I achieved at Oasis opened doors I never thought possible. The standard of teaching here rivals any school in Zimbabwe — absolutely world-class.",
    name: 'Farai Chikwanda',
    role: 'Alumnus · University of Zimbabwe',
  },
  {
    quote: "What makes Oasis special is the community. You are not just a student here — you are part of a family. The sport, the drama, the friendships — I wouldn't trade it for anything.",
    name: 'Blessing Moyo',
    role: 'Current Student · Form 3',
  },
]

const CAT_STYLES = {
  academic:        { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Academic'      },
  sports:          { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Sports'        },
  'sports-events': { bg: 'bg-teal-100',   text: 'text-teal-800',   label: 'Sports Events' },
  cultural:        { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cultural'      },
  admin:           { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Admin'         },
  holiday:         { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Holiday'       },
}

export default function Home() {
  const { getUpcomingEvents } = useCalendar()
  const { photos } = useGallery()
  const upcomingEvents = getUpcomingEvents(3)

  const { getFeatured } = useStaff()
  const featuredTeam = getFeatured().slice(0, 3)

  // Gallery carousel — 3 visible, auto-slides every 3 s, loops seamlessly
  const SLIDE_VISIBLE = 3
  const extended = useMemo(
    () => (photos.length > 0 ? [...photos, ...photos.slice(0, SLIDE_VISIBLE)] : []),
    [photos]
  )
  const [slideIdx, setSlideIdx] = useState(0)
  const [animate, setAnimate]   = useState(true)

  useEffect(() => {
    if (!extended.length) return
    const id = setInterval(() => setSlideIdx(p => p + 1), 3000)
    return () => clearInterval(id)
  }, [extended.length])

  useEffect(() => {
    if (slideIdx >= photos.length && photos.length > 0) {
      const id = setTimeout(() => {
        setAnimate(false)
        setSlideIdx(0)
      }, 500)
      return () => clearTimeout(id)
    }
  }, [slideIdx, photos.length])

  useEffect(() => {
    if (!animate) {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true))
      )
      return () => cancelAnimationFrame(id)
    }
  }, [animate])

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy/95" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24">
          <motion.div variants={stagger} initial="initial" animate="animate">
            <motion.div variants={fadeUp}>
              <span className="inline-block font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-gold border border-gold/40 px-5 py-2 rounded-full mb-8">
                Welcome to Oasis Private College · Checheche, Zimbabwe
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-playfair text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-none mb-6"
            >
              Where Excellence
              <br />
              <span className="text-gradient-gold">Flows</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl sm:text-2xl text-gray-300 font-sans max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              A premier day school shaping Zimbabwe's future leaders through knowledge, character, and excellence.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold uppercase tracking-wider text-sm px-8 py-4 rounded shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Explore Our College
              </Link>
              <Link
                to="/admissions"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-navy font-montserrat font-semibold uppercase tracking-wider text-sm px-8 py-4 rounded transition-all duration-300"
              >
                Apply for 2027
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gold/60 flex flex-col items-center gap-2"
        >
          <span className="font-montserrat text-xs uppercase tracking-widest">Scroll</span>
          <FaArrowDown className="text-sm" />
        </motion.div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <section className="bg-navy py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
            <StatCounter value="500" suffix="+"    label="Students Enrolled"  />
            <StatCounter value="95"  suffix="%"    label="ZIMSEC Pass Rate"   />
            <StatCounter value="40"  suffix="+"    label="Subjects Offered"   />
            <StatCounter value="12"  suffix=""     label="Years of Excellence" />
          </div>
        </div>
      </section>

      {/* ── ABOUT SNAPSHOT ─────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-4">
                Our Story
              </span>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-navy leading-tight mb-4">
                A Legacy of Academic<br />Excellence in Checheche
              </h2>
              <span className="gold-line-left" />
              <p className="mt-6 text-slate text-lg leading-relaxed">
                Oasis Private College stands as Checheche's premier educational institution — a beacon of academic rigour, moral integrity, and community spirit nestled in the heart of Manicaland. Since our founding, we have nurtured hundreds of Zimbabwe's brightest young minds.
              </p>
              <p className="mt-4 text-slate leading-relaxed">
                As a day school, we believe education thrives when home and school work in partnership. Our students arrive each morning energised by family, and leave each afternoon enriched by learning, friendship, and achievement.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-montserrat font-semibold uppercase tracking-wider text-sm px-7 py-3 rounded shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Our Full Story <FaChevronRight className="text-xs" />
                </Link>
                <Link
                  to="/admissions"
                  className="inline-flex items-center gap-2 border-2 border-navy text-navy hover:bg-navy hover:text-white font-montserrat font-semibold uppercase tracking-wider text-sm px-7 py-3 rounded transition-all duration-300"
                >
                  Admissions Info
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-gold/30 rounded-2xl" />
              <img
                src={studentsImg}
                alt="Students learning at Oasis Private College"
                className="relative rounded-2xl shadow-2xl object-cover w-full h-96 lg:h-[520px]"
              />
              <div className="absolute bottom-6 left-6 bg-navy/90 backdrop-blur-sm rounded-xl px-5 py-4 border border-gold/30">
                <div className="font-playfair text-gold text-xl font-bold">Day School</div>
                <div className="font-montserrat text-white text-xs uppercase tracking-wider mt-1">6:30 AM – 5:30 PM</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ACADEMIC PROGRAMS ──────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle
            label="Academic Excellence"
            title="Our Programmes"
            subtitle="Cambridge-aligned curriculum delivering world-class education from O-Level through A-Level, with specialist streams in STEM, Arts, and Commerce."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((p, i) => (
              <ProgramCard key={i} {...p} index={i} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/academics"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold uppercase tracking-wider text-sm px-8 py-3.5 rounded shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View Full Curriculum <FaChevronRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE OASIS ────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle
            label="Why Choose Us"
            title="The Oasis Difference"
            subtitle="Excellence is not accidental — it is the result of deliberate design, passionate teaching, and a community that lifts every student higher."
          />
          <div className="space-y-20">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}
              >
                <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-3">
                    0{i + 1}
                  </span>
                  <h3 className="font-playfair text-3xl md:text-4xl font-bold text-navy mb-3">{f.title}</h3>
                  <span className="gold-line-left" />
                  <p className="mt-5 text-slate text-lg leading-relaxed">{f.body}</p>
                </div>
                <div className={`relative ${i % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <img
                    src={f.image}
                    alt={f.title}
                    loading="lazy"
                    className="rounded-2xl shadow-2xl object-cover w-full h-72 md:h-80"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-gold/20" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPORTS & CULTURE STRIP ──────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${soccerImg})` }}
        />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-gold block mb-4">
              Sport & Culture
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
              Champions On &<br />Off The Field
            </h2>
            <span className="gold-line-center" />
            <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              At Oasis, sport builds character as powerfully as the classroom. Our students compete, perform, debate, and create — every single day.
            </p>
          </motion.div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mt-14 mb-12">
            {SPORTS_CULTURE.map(({ icon: Icon, label, teal }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`flex flex-col items-center gap-3 border rounded-xl py-5 px-2 transition-all duration-300 group ${
                  teal
                    ? 'bg-teal-900/40 border-teal-500/40 hover:bg-teal-500/20 hover:border-teal-400'
                    : 'bg-white/5 border-white/10 hover:bg-gold/20 hover:border-gold/50'
                }`}
              >
                <Icon className={`text-2xl group-hover:scale-110 transition-transform ${teal ? 'text-teal-400' : 'text-gold'}`} />
                <span className="font-montserrat text-xs font-semibold uppercase tracking-wider text-gray-300 group-hover:text-white text-center leading-tight">{label}</span>
              </motion.div>
            ))}
          </div>

          <Link
            to="/campus-life"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold uppercase tracking-wider text-sm px-8 py-3.5 rounded shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Explore Campus Life <FaChevronRight className="text-xs" />
          </Link>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ─────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-3">School Calendar</span>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-navy">Upcoming Events</h2>
              <span className="gold-line-left" />
            </div>
            <Link to="/calendar" className="flex items-center gap-2 text-gold hover:text-gold-dark font-montserrat text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0">
              View Full Calendar <FaChevronRight className="text-xs" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-slate-light text-center py-10">No upcoming events. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((event, i) => {
                const cat = CAT_STYLES[event.category] || CAT_STYLES.academic
                const date = new Date(event.date + 'T00:00:00')
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-gray-100 hover:border-gold/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="h-2 bg-navy" />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-shrink-0 w-14 h-14 bg-navy rounded-xl flex flex-col items-center justify-center">
                          <span className="font-playfair text-xl font-bold text-gold leading-none">{date.getDate()}</span>
                          <span className="font-montserrat text-xs text-gray-300 uppercase mt-0.5">{date.toLocaleString('default',{month:'short'})}</span>
                        </div>
                        <span className={`${cat.bg} ${cat.text} text-xs font-montserrat font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full`}>
                          {cat.label}
                        </span>
                      </div>
                      <h3 className="font-playfair text-lg font-semibold text-navy group-hover:text-gold transition-colors mb-2">{event.title}</h3>
                      {event.time && <p className="text-xs text-slate-light font-montserrat mb-1">{event.time}</p>}
                      {event.location && <p className="text-xs text-slate-light font-montserrat mb-3">{event.location}</p>}
                      <p className="text-sm text-slate leading-relaxed line-clamp-2">{event.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── GALLERY PREVIEW ─────────────────────────────────────── */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-3">Photo Gallery</span>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-navy">Life at Oasis</h2>
              <span className="gold-line-left" />
            </div>
            <Link to="/gallery" className="flex items-center gap-2 text-gold hover:text-gold-dark font-montserrat text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0">
              View Full Gallery <FaChevronRight className="text-xs" />
            </Link>
          </div>

          <div className="overflow-hidden -mx-2">
            <div
              className={`flex ${animate ? 'transition-transform duration-500 ease-in-out' : ''}`}
              style={{ transform: `translateX(-${slideIdx * (100 / SLIDE_VISIBLE)}%)` }}
            >
              {extended.map((photo, i) => (
                <div
                  key={`${photo.id}-${i}`}
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / SLIDE_VISIBLE}%` }}
                >
                  <Link to="/gallery">
                    <div className="group relative overflow-hidden rounded-xl cursor-pointer shadow-md hover:shadow-2xl">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={photo.src}
                          alt={photo.caption}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-white text-xs font-sans line-clamp-2">{photo.caption}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle
            label="What They Say"
            title="Voices of Our Community"
            subtitle="From parents to alumni to current students — hear what makes Oasis Private College so special."
            light
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── MEET OUR TEAM ───────────────────────────────────────── */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-3">
                Our Educators
              </span>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">
                Dedicated Educators,<br />Exceptional Outcomes
              </h2>
              <span className="block mt-4 w-16 h-1 bg-gold rounded-full" />
            </div>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Our qualified and passionate staff are the heart of Oasis Private College — shaping every student's future.
            </p>
          </div>

          {featuredTeam.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {featuredTeam.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                >
                  <StaffCard {...member} size="sm" />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link
              to="/staff"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold uppercase tracking-wider text-sm px-8 py-3.5 rounded shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Meet the Full Team <FaChevronRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────── */}
      <section className="bg-gold py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-navy/70 block mb-4">
              Admissions Open
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-navy mb-4">
              Applications for 2027 Are Now Open
            </h2>
            <p className="text-navy/70 text-lg mb-8 max-w-xl mx-auto font-sans">
              Join Oasis Private College — where every student finds their voice, their talent, and their future.
            </p>
            <Link
              to="/admissions"
              className="inline-flex items-center gap-2 bg-navy hover:bg-navy-light text-white font-montserrat font-bold uppercase tracking-wider text-sm px-10 py-4 rounded shadow-2xl hover:shadow-navy/40 transition-all duration-300"
            >
              Apply Now <FaChevronRight className="text-xs" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
