import { motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import { FaFlask, FaGlobe, FaLaptop, FaChartBar, FaBookOpen, FaLanguage, FaCheckCircle, FaUniversity } from 'react-icons/fa'

const DEPARTMENTS = [
  {
    icon: FaFlask,
    name: 'Sciences',
    color: 'bg-blue-50 border-blue-200',
    subjects: ['Biology', 'Chemistry', 'Physics', 'Combined Science', 'Environmental Science'],
  },
  {
    icon: FaGlobe,
    name: 'Humanities & Social Sciences',
    color: 'bg-green-50 border-green-200',
    subjects: ['History', 'Geography', 'Divinity/Religious Studies', 'Sociology', 'Shona', 'Ndebele'],
  },
  {
    icon: FaChartBar,
    name: 'Commerce',
    color: 'bg-yellow-50 border-yellow-200',
    subjects: ['Accounting', 'Business Studies', 'Economics', 'Commerce', 'Entrepreneurship'],
  },
  {
    icon: FaLanguage,
    name: 'Languages & Arts',
    color: 'bg-purple-50 border-purple-200',
    subjects: ['English Language', 'English Literature', 'French', 'Art & Design', 'Music'],
  },
  {
    icon: FaLaptop,
    name: 'Technology',
    color: 'bg-red-50 border-red-200',
    subjects: ['Computer Science', 'Information Technology', 'Technical Graphics', 'Design & Technology'],
  },
  {
    icon: FaBookOpen,
    name: 'Mathematics',
    color: 'bg-orange-50 border-orange-200',
    subjects: ['Mathematics', 'Additional Mathematics', 'Statistics', 'Further Mathematics (A-Level)'],
  },
]

const RESULTS = [
  { label: 'O-Level Pass Rate', value: '95%', detail: 'ZIMSEC & Cambridge' },
  { label: 'A-Level Pass Rate', value: '91%', detail: 'Cambridge International' },
  { label: 'University Placement', value: '88%', detail: 'Of A-Level graduates' },
  { label: '5+ A* Grades', value: '47', detail: 'Students last year' },
]

const UNIVERSITIES = [
  'University of Zimbabwe', 'NUST Bulawayo', 'Midlands State University',
  'Great Zimbabwe University', 'BUSE', 'University of Cape Town',
  'Stellenbosch University', 'Rhodes University', 'UKZN',
]

const SUPPORT = [
  { title: 'Morning Study Sessions',  desc: 'Supervised early-morning study from 6:30 AM before classes begin — ideal for revision and exam preparation.' },
  { title: 'Afternoon Tutorials',     desc: 'Subject-specific small-group tutorials from 4:00–5:00 PM, led by specialist teachers.' },
  { title: 'Peer Mentoring',          desc: 'A formal peer mentoring programme pairing high-achieving seniors with juniors who need academic support.' },
  { title: 'Exam Preparation',        desc: 'Dedicated exam technique workshops, past paper sessions, and mock examinations for O-Level and A-Level candidates.' },
]

export default function Academics() {
  return (
    <>
      <PageHero
        title="Academic Excellence"
        subtitle="Cambridge-aligned programmes delivering world-class education from O-Level through A-Level."
        breadcrumb={[{ label: 'Academics' }]}
        image="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1920&q=80"
      />

      {/* Programme Overview */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle label="Curriculum" title="Our Academic Programmes" subtitle="Two flagship Cambridge-aligned pathways, supported by specialist departments and world-class facilities." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {[
              {
                level: 'O-Level',
                tag: 'Forms 1 – 4',
                desc: 'A rigorous four-year programme leading to Cambridge O-Level and ZIMSEC examinations. Students study a broad range of subjects before specialising in their areas of strength. Core subjects include English, Mathematics, Sciences, and a Humanities or Commerce elective.',
                highlights: ['8–10 subjects', 'Cambridge & ZIMSEC', 'Broad foundation', 'University entry qualification'],
                image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=700&q=80',
              },
              {
                level: 'A-Level',
                tag: 'Lower & Upper 6',
                desc: 'A two-year advanced programme offering Cambridge A-Level qualifications in Science, Humanities, Commerce, and Technology streams. Students focus on 3–4 specialist subjects, developing the depth and analytical skills required for top university admission.',
                highlights: ['3–4 specialist subjects', 'Cambridge International', 'University preparation', 'Critical thinking focus'],
                image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=700&q=80',
              },
            ].map(({ level, tag, desc, highlights, image }, i) => (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-gold/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img src={image} alt={level} className="w-full h-full object-cover" />
                </div>
                <div className="p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-navy text-gold font-montserrat font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-full">{level}</span>
                    <span className="text-slate-light text-sm font-montserrat">{tag}</span>
                  </div>
                  <p className="text-slate leading-relaxed mb-5">{desc}</p>
                  <ul className="space-y-2">
                    {highlights.map(h => (
                      <li key={h} className="flex items-center gap-3 text-sm text-slate">
                        <FaCheckCircle className="text-gold flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="Curriculum Departments" title="Subjects by Department" subtitle="A comprehensive range of subjects across six specialist departments, taught by qualified and experienced educators." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPARTMENTS.map(({ icon: Icon, name, color, subjects }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 border-2 ${color} hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="text-navy text-2xl" />
                  <h3 className="font-playfair font-bold text-navy text-lg">{name}</h3>
                </div>
                <ul className="space-y-2">
                  {subjects.map(s => (
                    <li key={s} className="flex items-center gap-2 text-sm text-slate">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle label="Track Record" title="Outstanding Results" light />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {RESULTS.map(({ label, value, detail }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-white/5 border border-white/10 hover:border-gold/40 rounded-2xl transition-all duration-300"
              >
                <div className="font-playfair text-5xl font-bold text-gold mb-2">{value}</div>
                <div className="font-montserrat text-white text-sm font-semibold uppercase tracking-wider">{label}</div>
                <div className="text-gray-400 text-xs mt-1">{detail}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* University Destinations */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle label="Where Our Graduates Go" title="University Destinations" subtitle="Oasis alumni are studying at leading universities across Zimbabwe and the region." />
          <div className="flex flex-wrap justify-center gap-3">
            {UNIVERSITIES.map((uni, i) => (
              <motion.div
                key={uni}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gold/50 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <FaUniversity className="text-gold text-sm" />
                <span className="font-montserrat text-sm text-navy font-semibold">{uni}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Support */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="Student Support" title="Academic Support Programmes" subtitle="We leave no student behind. Our comprehensive academic support ensures every learner reaches their potential." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUPPORT.map(({ title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 p-6 bg-cream rounded-2xl border border-gray-100 hover:border-gold/40 hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FaCheckCircle className="text-gold" />
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
    </>
  )
}
