import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import { Link } from 'react-router-dom'
import { FaCheckCircle, FaChevronDown, FaChevronRight, FaClock, FaPhone, FaEnvelope } from 'react-icons/fa'

const STEPS = [
  { num: '01', title: 'Download & Complete Application Form', desc: 'Obtain the application form from the school office or download it from our website. Complete all sections clearly in block letters.' },
  { num: '02', title: 'Gather Required Documents',            desc: 'Collect all required supporting documents as listed in the checklist below. Ensure all copies are certified where required.' },
  { num: '03', title: 'Submit Application',                  desc: 'Submit your completed application form and all supporting documents to the Admissions Office in person or by post.' },
  { num: '04', title: 'Entrance Assessment',                  desc: 'Shortlisted candidates will be invited to write an entrance assessment covering English, Mathematics, and General Knowledge.' },
  { num: '05', title: 'Offer & Enrolment',                    desc: 'Successful candidates receive a formal offer letter. Accept the offer by paying the required fees and submitting any outstanding documents.' },
]

const DOCUMENTS = {
  'Form 1 Entry': [
    'Completed application form',
    'Certified copy of birth certificate',
    'Certified copies of Grade 7 report cards (last 2 terms)',
    'Grade 7 school-leaving certificate',
    'Two recent passport photographs',
    'Completed medical history form',
    'Proof of residence',
  ],
  'Lower 6 Entry': [
    'Completed application form',
    'Certified copy of birth certificate',
    'Official O-Level results slip (ZIMSEC or Cambridge)',
    'Form 4 school-leaving certificate',
    'Two recent passport photographs',
    'Completed medical history form',
    'Proof of residence',
    'Reference letter from previous school',
  ],
}

const FEES = [
  { item: 'Application Fee (non-refundable)',   form1: '$10', l6: '$10' },
  { item: 'Registration / Enrolment Fee',       form1: '$150', l6: '$150' },
  { item: 'Tuition Fee (per term)',             form1: '$320', l6: '$380' },
  { item: 'Stationery & Textbook Levy',         form1: '$45',  l6: '$55'  },
  { item: 'Sports & Culture Levy',              form1: '$30',  l6: '$30'  },
  { item: 'ICT / Computer Lab Fee',             form1: '$20',  l6: '$20'  },
  { item: 'Development Levy (annual)',          form1: '$80',  l6: '$80'  },
]

const KEY_DATES = [
  { date: 'June 2026',      event: 'Applications for 2027 open' },
  { date: 'September 2026', event: 'Entrance assessments — Form 1' },
  { date: 'October 2026',   event: 'Entrance assessments — Lower 6' },
  { date: 'November 2026',  event: 'Offer letters dispatched' },
  { date: 'December 2026',  event: 'Enrolment confirmation deadline' },
  { date: 'January 2027',   event: 'Term 1 begins — new students' },
]

const FAQS = [
  { q: 'What are the minimum O-Level requirements for Form 1 entry?',
    a: 'There are no O-Level prerequisites for Form 1 entry. Students are assessed via our entrance assessment covering English, Mathematics, and General Knowledge.' },
  { q: 'What O-Level grades are required for Lower 6 entry?',
    a: 'Minimum 5 O-Level passes at Grade C or above, including English Language and Mathematics. For Science A-Level, passes in the relevant sciences are required.' },
  { q: 'Is Oasis Private College a boarding school?',
    a: 'No — Oasis Private College is a day school. School gates open at 6:30 AM and close at 5:30 PM. After-school activities run until 5:00 PM.' },
  { q: 'Are there scholarships or bursaries available?',
    a: 'Oasis offers a limited number of merit-based scholarships for exceptional students. Contact the Admissions Office for details on eligibility and application.' },
  { q: 'What uniform is required?',
    a: 'Oasis has a full school uniform including blazer, shirt/blouse, trousers/skirt, and school tie. The complete uniform list is provided upon acceptance.' },
  { q: 'Can international students apply?',
    a: 'Yes, international students are welcome to apply. Additional documentation including proof of legal residence or study permit may be required.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full py-5 text-left gap-4 hover:text-gold transition-colors"
      >
        <span className="font-playfair font-semibold text-navy text-base">{q}</span>
        <FaChevronDown className={`text-gold flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Admissions() {
  const [docTab, setDocTab] = useState('Form 1 Entry')

  return (
    <>
      <PageHero
        title="Admissions"
        subtitle="Join Zimbabwe's premier day school. Applications for 2027 are now open."
        breadcrumb={[{ label: 'Admissions' }]}
        image="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80"
      />

      {/* Day school note */}
      <div className="bg-gold py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-navy text-center">
          <FaClock className="text-xl flex-shrink-0" />
          <p className="font-montserrat text-sm font-semibold">
            <strong>Day School:</strong> Oasis Private College is a day school. School gates open at 6:30 AM and close at 5:30 PM, Monday to Friday.
          </p>
        </div>
      </div>

      {/* Application Process */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle label="How to Apply" title="Application Process" subtitle="Five simple steps to joining the Oasis family." />
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-7 top-6 bottom-6 w-px bg-gold/30 hidden md:block" />
            <div className="space-y-6">
              {STEPS.map(({ num, title, desc }, i) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0 w-14 h-14 bg-navy rounded-full flex items-center justify-center border-4 border-cream relative z-10 shadow-lg">
                    <span className="font-montserrat font-bold text-gold text-sm">{num}</span>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 hover:border-gold/40 hover:shadow-md transition-all duration-300 mt-1">
                    <h3 className="font-playfair font-bold text-navy text-lg mb-2">{title}</h3>
                    <p className="text-slate text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-montserrat font-bold uppercase tracking-wider text-sm px-8 py-3.5 rounded shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Contact Admissions <FaChevronRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle label="Fee Structure" title="School Fees 2026/2027" light
            subtitle="All fees are quoted in USD. Payment plans are available — contact the Bursar for details." />
          <div className="overflow-x-auto rounded-2xl border border-white/10 max-w-4xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10">
                  <th className="text-left font-montserrat text-xs uppercase tracking-wider text-gold px-6 py-4">Fee Item</th>
                  <th className="text-center font-montserrat text-xs uppercase tracking-wider text-gold px-4 py-4">Form 1 – 4</th>
                  <th className="text-center font-montserrat text-xs uppercase tracking-wider text-gold px-4 py-4">Lower & Upper 6</th>
                </tr>
              </thead>
              <tbody>
                {FEES.map(({ item, form1, l6 }, i) => (
                  <tr key={item} className={`border-t border-white/10 ${i % 2 === 0 ? 'bg-white/3' : ''}`}>
                    <td className="px-6 py-4 text-gray-300">{item}</td>
                    <td className="px-4 py-4 text-center font-semibold text-white">{form1}</td>
                    <td className="px-4 py-4 text-center font-semibold text-white">{l6}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-xs text-center mt-4 max-w-2xl mx-auto">
            * Fees are subject to annual review. Development levy is payable once per year. All fees payable at the beginning of each term.
          </p>
        </div>
      </section>

      {/* Documents */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="Requirements" title="Required Documents" subtitle="Ensure all documents are ready before submitting your application to avoid delays." />
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 mb-8">
              {Object.keys(DOCUMENTS).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDocTab(tab)}
                  className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all duration-200 ${
                    docTab === tab
                      ? 'bg-navy text-white shadow-lg'
                      : 'bg-cream text-slate hover:bg-gold/10 hover:text-navy border border-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="bg-cream rounded-2xl p-8 border border-gray-100">
              <ul className="space-y-3">
                {DOCUMENTS[docTab].map((doc, i) => (
                  <motion.li
                    key={doc}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <FaCheckCircle className="text-gold mt-0.5 flex-shrink-0" />
                    <span className="text-slate text-sm">{doc}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Dates */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle label="Important Dates" title="Key Admissions Dates" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {KEY_DATES.map(({ date, event }, i) => (
              <motion.div
                key={event}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gold/40 hover:shadow-md transition-all duration-300 flex gap-4 items-center"
              >
                <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                <div>
                  <p className="font-montserrat text-xs font-bold uppercase tracking-wider text-gold">{date}</p>
                  <p className="text-navy font-semibold text-sm mt-0.5">{event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="Questions" title="Frequently Asked Questions" />
          <div className="max-w-3xl mx-auto bg-cream rounded-2xl p-8 border border-gray-100">
            {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>
      </section>

      {/* CTA contact */}
      <section className="section-padding bg-navy">
        <div className="container-max text-center">
          <SectionTitle label="Get In Touch" title="Ready to Apply?" light
            subtitle="Our Admissions team is available Monday to Friday to answer your questions and guide you through the process." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: FaPhone,   label: 'Call Us',        value: '+263 712 345 678',        href: 'tel:+263712345678' },
              { icon: FaEnvelope,label: 'Email',          value: 'admissions@oasiscollege.ac.zw', href: 'mailto:admissions@oasiscollege.ac.zw' },
              { icon: FaClock,   label: 'Office Hours',   value: 'Mon–Fri · 7:00 AM – 4:00 PM', href: null },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-gold/40 transition-colors">
                <Icon className="text-gold text-2xl mx-auto mb-3" />
                <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-1">{label}</p>
                {href
                  ? <a href={href} className="text-white hover:text-gold transition-colors text-sm break-all">{value}</a>
                  : <p className="text-gray-300 text-sm">{value}</p>
                }
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
