import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import StaffCard from '../components/StaffCard'
import { useStaff } from '../hooks/useStaff'
import { FaStar, FaShieldAlt, FaLightbulb, FaUsers, FaHeart, FaBookOpen, FaPrayingHands, FaChevronRight } from 'react-icons/fa'
import schoolImg from '../assets/school.jpg'
import oasisImg from '../assets/oasis.jpg'
import directorImg from '../assets/School director.jpg'
import teacherImg from '../assets/Senior Geography Teacher.jpg'
import studentsImg from '../assets/our students.jpg'
import heroImg from '../assets/hero.png'

const VALUES = [
  { icon: FaStar,         title: 'Excellence',   desc: 'We set high standards and pursue them relentlessly — in academics, sport, culture, and character.' },
  { icon: FaShieldAlt,    title: 'Integrity',    desc: 'Honesty, transparency, and ethical conduct are the bedrock of every interaction at Oasis.' },
  { icon: FaLightbulb,    title: 'Innovation',   desc: 'We embrace curiosity and creativity, preparing students for a rapidly evolving world.' },
  { icon: FaBookOpen,     title: 'Discipline',   desc: 'A structured, purposeful environment where students learn the value of commitment and hard work.' },
  { icon: FaUsers,        title: 'Community',    desc: 'A warm, inclusive day school community where every student belongs and every voice matters.' },
  { icon: FaPrayingHands, title: 'Faith',        desc: 'Grounded in moral and spiritual values that guide our students toward becoming responsible citizens.' },
]

const LEADERSHIP = [
  {
    name: 'Mr. Tafadzwa Chimombe',
    role: 'School Principal',
    bio: 'A visionary leader with over 20 years in education, Mr. Chimombe holds a Masters in Educational Leadership from the University of Zimbabwe and has guided Oasis to national recognition.',
    image: directorImg,
  },
  {
    name: 'Mrs. Grace Mutasa',
    role: 'Deputy Principal',
    bio: 'Mrs. Mutasa oversees pastoral care and student welfare with unmatched dedication. A Cambridge-trained educator, she has been at Oasis since its founding.',
    image: teacherImg,
  },
  {
    name: 'Mr. Solomon Nyathi',
    role: 'Head of Academics',
    bio: 'Mr. Nyathi drives the school\'s academic strategy and curriculum development. Under his leadership, O-Level and A-Level results have improved consecutively for four years.',
    image: studentsImg,
  },
]

const TIMELINE = [
  { year: '2012', title: 'Founded',             desc: 'Oasis Private College opens its doors with 45 students and a founding team of 8 teachers, guided by a vision of excellence.' },
  { year: '2014', title: 'First O-Level Intake', desc: 'The first Form 4 cohort writes O-Level examinations, achieving a remarkable 91% pass rate and setting the standard for years to come.' },
  { year: '2016', title: 'A-Level Programme Launched', desc: 'Oasis introduces the Cambridge A-Level programme, welcoming its first Lower 6 students into what would become a flagship academic offering.' },
  { year: '2018', title: 'New Science Block',   desc: 'A state-of-the-art science laboratory complex is officially opened, dramatically enhancing STEM education for all students.' },
  { year: '2020', title: 'National Recognition', desc: 'Oasis Private College is recognised as one of Zimbabwe\'s top-performing private schools by the Ministry of Primary and Secondary Education.' },
  { year: '2023', title: 'Library & ICT Upgrade', desc: 'Major expansion of the library and complete overhaul of the ICT facility, bringing world-class digital learning resources to Checheche.' },
  { year: '2026', title: 'Today',               desc: 'With 500+ students, 95% pass rate, and a thriving community, Oasis continues to transform lives and shape Zimbabwe\'s future leaders.' },
]

export default function About() {
  const { getFeatured } = useStaff()
  const featuredLeadership = getFeatured()

  const displayLeadership = featuredLeadership.length > 0
    ? featuredLeadership
    : LEADERSHIP.map((l, i) => ({
        id: `static-${i}`,
        name: l.name,
        title: l.role,
        department: 'Leadership',
        qualification: '',
        description: l.bio,
        photo: l.image,
        featured: true,
      }))

  return (
    <>
      <PageHero
        title="About Oasis Private College"
        subtitle="Our story, our values, and the people who make Oasis exceptional."
        breadcrumb={[{ label: 'About' }]}
        image={schoolImg}
      />

      {/* Story */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <SectionTitle
                label="Our Story"
                title="From Vision to Legacy"
                align="left"
              />
              <div className="space-y-4 text-slate leading-relaxed">
                <p>
                  Oasis Private College was born from a simple yet powerful belief: that every child in Checheche deserves access to a world-class education. Founded in 2012 by a group of passionate educators and community leaders, the school opened its doors to 45 students who would become the foundation of an extraordinary legacy.
                </p>
                <p>
                  Set in the heart of Chipinge District, Manicaland Province, Oasis has grown from a modest institution into the region's premier day school — earning national recognition for academic excellence, sporting achievement, and vibrant cultural life.
                </p>
                <p>
                  Today, Oasis Private College serves over 500 students across Forms 1 through Upper 6, supported by a faculty of over 40 dedicated teachers. Our Cambridge-aligned curriculum, combined with a rich co-curricular programme, ensures every student receives a truly holistic education.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -top-4 -right-4 w-full h-full border-2 border-gold/30 rounded-2xl" />
              <img
                src={oasisImg}
                alt="Oasis College campus"
                className="relative rounded-2xl shadow-2xl object-cover w-full h-96"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle label="Direction" title="Vision & Mission" light />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                tag: 'Our Vision',
                text: 'To be the leading centre of academic excellence and holistic human development in Manicaland, producing confident, compassionate, and capable citizens who drive Zimbabwe\'s progress.',
              },
              {
                tag: 'Our Mission',
                text: 'To provide a rigorous, stimulating, and inclusive education that develops intellectually curious, morally grounded, and socially responsible individuals through outstanding teaching, vibrant co-curricular life, and a strong sense of community.',
              },
            ].map(({ tag, text }) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 hover:border-gold/40 rounded-2xl p-8 transition-all duration-300"
              >
                <span className="font-montserrat text-xs font-semibold uppercase tracking-widest text-gold block mb-4">{tag}</span>
                <p className="text-gray-300 text-lg leading-relaxed italic">"{text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="What We Stand For" title="Our Core Values" subtitle="Six pillars that define the Oasis character and guide every decision we make." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 p-6 bg-cream rounded-2xl border border-gray-100 hover:border-gold/50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold transition-colors duration-300">
                  <Icon className="text-gold text-xl group-hover:text-navy transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="font-playfair font-bold text-navy text-lg mb-1">{title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle label="Our People" title="Leadership Team" subtitle="The experienced educators guiding Oasis Private College toward its vision." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayLeadership.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <StaffCard {...member} size="lg" />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/staff"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-dark font-montserrat text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              View Full Team <FaChevronRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle label="Our Journey" title="School Timeline" light />
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gold/20" />
            <div className="space-y-10">
              {TIMELINE.map(({ year, title, desc }, i) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative flex gap-6 pl-20"
                >
                  <div className="absolute left-0 w-16 flex items-start justify-end pt-1">
                    <div className="absolute left-[28px] top-2 w-2 h-2 rounded-full bg-gold border-2 border-navy" />
                    <span className="font-playfair text-gold font-bold text-lg">{year}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 hover:border-gold/30 rounded-xl p-5 flex-1 transition-all duration-300">
                    <h4 className="font-playfair text-white font-semibold text-lg mb-1">{title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accreditations */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="Accreditation" title="Recognised & Accredited" subtitle="Oasis Private College meets the highest standards set by national and international educational bodies." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { name: 'ZIMSEC', desc: 'Zimbabwe School Examinations Council — full accreditation for O-Level and A-Level examinations.', badge: 'ZIM' },
              { name: 'Cambridge International', desc: 'Registered Cambridge International school delivering IGCSE, O-Level, and A-Level programmes.', badge: 'CI' },
              { name: 'Ministry of Education', desc: 'Fully registered and approved by the Zimbabwe Ministry of Primary and Secondary Education.', badge: 'MOE' },
            ].map(({ name, desc, badge }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center p-8 bg-cream rounded-2xl border border-gray-100 hover:border-gold/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-montserrat font-bold text-gold text-xs tracking-wider">{badge}</span>
                </div>
                <h3 className="font-playfair font-bold text-navy text-lg mb-2">{name}</h3>
                <p className="text-slate text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
