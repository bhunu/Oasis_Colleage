import { useState } from 'react'
import { motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import Toast from '../components/Toast'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa'

const QUICK_CONTACTS = [
  { icon: FaEnvelope, label: 'General Enquiries', email: 'info@oasiscollege.ac.zw',         phone: '+263 712 345 678', desc: 'For general information about the school, programmes, and events.' },
  { icon: FaEnvelope, label: 'Admissions Office',  email: 'admissions@oasiscollege.ac.zw',  phone: '+263 712 345 679', desc: 'Enquiries about applications, entrance assessments, and enrolment.' },
  { icon: FaEnvelope, label: "Bursar's Office",    email: 'bursar@oasiscollege.ac.zw',       phone: '+263 712 345 680', desc: 'Fees, payment plans, financial statements, and receipts.' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    setToast({ msg: 'Thank you! Your message has been received. We will respond within 1–2 business days.', type: 'success' })
  }

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you. Reach out to our team any time during school hours."
        breadcrumb={[{ label: 'Contact' }]}
        image="https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80"
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <section className="section-padding bg-cream">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Contact form */}
            <div className="lg:col-span-2">
              <SectionTitle label="Send a Message" title="Get In Touch" align="left" />
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Full Name *</label>
                    <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors"
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Email Address *</label>
                    <input type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors"
                      placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Phone Number</label>
                    <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors"
                      placeholder="+263 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="label-tag text-slate-dark block mb-1.5">Subject *</label>
                    <select required value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors bg-white">
                      <option value="">Select a subject</option>
                      <option>General Enquiry</option>
                      <option>Admissions</option>
                      <option>Fees & Payments</option>
                      <option>Academic Query</option>
                      <option>Events & Calendar</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-tag text-slate-dark block mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors resize-none"
                    placeholder="Write your message here..." />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gold hover:bg-gold-light disabled:opacity-70 text-navy font-montserrat font-bold uppercase tracking-wider text-sm py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </motion.form>
            </div>

            {/* Contact details */}
            <div>
              <SectionTitle label="Find Us" title="Contact Details" align="left" />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-navy rounded-2xl p-8 text-gray-300 space-y-6"
              >
                <div className="flex gap-4">
                  <FaMapMarkerAlt className="text-gold text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-1">Address</p>
                    <p className="text-sm leading-relaxed">Checheche, Chipinge District<br />Manicaland Province<br />Zimbabwe</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <FaPhone className="text-gold text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-1">Phone</p>
                    <a href="tel:+263712345678" className="text-sm hover:text-gold transition-colors">+263 712 345 678</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <FaEnvelope className="text-gold text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-1">Email</p>
                    <a href="mailto:info@oasiscollege.ac.zw" className="text-sm hover:text-gold transition-colors break-all">info@oasiscollege.ac.zw</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <FaClock className="text-gold text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-1">Office Hours</p>
                    <p className="text-sm leading-relaxed">Monday – Friday<br />6:30 AM – 5:30 PM<br /><span className="text-gold/70 text-xs">Day School Hours</span></p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-5">
                  <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-3">Follow Us</p>
                  <div className="flex gap-3">
                    {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, i) => (
                      <button key={i} className="w-9 h-9 bg-white/5 hover:bg-gold rounded-full flex items-center justify-center text-gray-400 hover:text-navy transition-all duration-300">
                        <Icon className="text-sm" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Map placeholder */}
              <div className="mt-6 rounded-2xl overflow-hidden border border-gray-200 h-48 bg-gray-100 flex items-center justify-center">
                <div className="text-center px-6">
                  <FaMapMarkerAlt className="text-gold text-3xl mx-auto mb-2" />
                  <p className="text-slate-light text-sm font-sans">Checheche, Chipinge District</p>
                  <p className="text-slate-light text-xs mt-1">Manicaland, Zimbabwe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick contact cards */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle label="Direct Contacts" title="Quick Contact" light />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QUICK_CONTACTS.map(({ icon: Icon, label, email, phone, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white/5 border border-white/10 hover:border-gold/40 rounded-2xl p-7 transition-all duration-300 group"
              >
                <Icon className="text-gold text-2xl mb-4" />
                <h3 className="font-playfair text-white font-bold text-lg mb-2">{label}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{desc}</p>
                <a href={`mailto:${email}`} className="block text-gold hover:text-gold-light text-sm transition-colors mb-1 break-all">{email}</a>
                <a href={`tel:${phone.replace(/\s/g,'')}`} className="block text-gray-400 hover:text-white text-sm transition-colors">{phone}</a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
