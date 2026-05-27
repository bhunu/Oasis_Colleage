import { Link } from 'react-router-dom'
import { FaGraduationCap, FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa'

const LINKS = {
  'Quick Links': [
    { label: 'About Us',    href: '/about'       },
    { label: 'Academics',   href: '/academics'   },
    { label: 'Admissions',  href: '/admissions'  },
    { label: 'Campus Life', href: '/campus-life' },
    { label: 'Calendar',    href: '/calendar'    },
    { label: 'Gallery',     href: '/gallery'     },
    { label: 'News',        href: '/news'        },
    { label: 'Contact',     href: '/contact'     },
  ],
}

const SOCIALS = [
  { Icon: FaFacebookF, label: 'Facebook'  },
  { Icon: FaTwitter,   label: 'Twitter'   },
  { Icon: FaInstagram, label: 'Instagram' },
  { Icon: FaYoutube,   label: 'YouTube'   },
]

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-gold rounded-full flex items-center justify-center">
                <FaGraduationCap className="text-navy text-xl" />
              </div>
              <div>
                <div className="font-playfair text-white font-bold text-base leading-tight">Oasis Private College</div>
                <div className="font-montserrat text-gold text-xs uppercase tracking-widest">Checheche, Zimbabwe</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-gray-400">
              A premier day school in the heart of Checheche, shaping Zimbabwe's future leaders through academic excellence, strong character, and vibrant community.
            </p>
            <p className="font-playfair italic text-gold text-sm">"Knowledge. Character. Excellence."</p>
            <div className="flex gap-3 mt-6">
              {SOCIALS.map(({ Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 bg-white/5 hover:bg-gold rounded-full flex items-center justify-center text-gray-400 hover:text-navy transition-all duration-300"
                >
                  <Icon className="text-sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-5">Quick Links</h4>
            <ul className="space-y-2">
              {LINKS['Quick Links'].map(l => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-sm text-gray-400 hover:text-gold transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/40 flex-shrink-0" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-5">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-gold mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">Checheche, Chipinge District,<br />Manicaland Province, Zimbabwe</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-gold flex-shrink-0" />
                <a href="tel:+263712345678" className="text-gray-400 hover:text-gold transition-colors">+263 712 345 678</a>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-gold flex-shrink-0" />
                <a href="mailto:info@oasiscollege.ac.zw" className="text-gray-400 hover:text-gold transition-colors break-all">
                  info@oasiscollege.ac.zw
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaClock className="text-gold mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">Mon – Fri: 6:30 AM – 5:30 PM<br />Day School</span>
              </li>
            </ul>
          </div>

          {/* Mission */}
          <div>
            <h4 className="font-montserrat text-xs font-bold uppercase tracking-widest text-gold mb-5">Our Mission</h4>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-sm text-gray-400 leading-relaxed italic mb-4">
                "To provide holistic education that develops intellectually curious, morally grounded, and socially responsible individuals ready to lead and transform Zimbabwe and the world."
              </p>
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-gold" /> Day School · Checheche</div>
                <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-gold" /> Cambridge O & A Level</div>
                <div className="flex items-center gap-2 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-gold" /> ZIMSEC Accredited</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-montserrat">
          <span>© {new Date().getFullYear()} Oasis Private College. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            Day School · Checheche, Zimbabwe
          </span>
        </div>
      </div>
    </footer>
  )
}
