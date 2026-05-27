import { motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import { FaFutbol, FaRunning, FaBasketballBall, FaSwimmer, FaChessKnight, FaTableTennis,
         FaTheaterMasks, FaMusic, FaGlobeAfrica, FaComments, FaPalette, FaStar,
         FaUsers, FaTrophy, FaClock, FaBookOpen, FaMedal, FaHandshake, FaAward } from 'react-icons/fa'
import soccerImg from '../assets/soccer team.jpg'
import classroomImg from '../assets/classroom setup.jpg'
import computerLabImg from '../assets/computer lab.jpg'
import communityImg from '../assets/community cleaning.jpg'
import form1sImg from '../assets/form 1s.jpg'
import oasisImg from '../assets/oasis.jpg'

const TEAM_SPORTS = [
  { icon: FaFutbol,       name: 'Football',   desc: 'Boys and girls football teams compete at district, provincial, and national levels. Football is one of our proudest sporting traditions.' },
  { icon: FaBasketballBall,name: 'Netball',   desc: 'Our netball team is a force in Manicaland. Regular inter-school fixtures and tournaments keep the competitive spirit alive.' },
  { icon: FaBasketballBall,name: 'Basketball', desc: 'A growing programme with dedicated courts. Students develop teamwork, agility, and competitive spirit.' },
  { icon: FaUsers,         name: 'Volleyball', desc: 'Both indoor and outdoor volleyball, with inter-form and inter-school competitions throughout the year.' },
]

const IND_SPORTS = [
  { icon: FaRunning,      name: 'Athletics',     desc: 'Track and field athletes represent Oasis at district and provincial championships, consistently bringing home medals.' },
  { icon: FaSwimmer,      name: 'Swimming',       desc: 'Swimming galas and inter-school meets. Students develop technique, endurance, and a love of the water.' },
  { icon: FaChessKnight,  name: 'Chess',          desc: 'A thriving chess club with national-level competitors. Chess builds strategic thinking across all subjects.' },
  { icon: FaTableTennis,  name: 'Table Tennis',   desc: 'Fast, fun, and fiercely competitive. Table tennis is a popular after-school activity and inter-house competition.' },
]

const CULTURE = [
  { icon: FaTheaterMasks, name: 'Drama & Theatre',        desc: 'The Drama Club performs original and adapted plays at the annual Drama Festival and community events.' },
  { icon: FaMusic,         name: 'Music Ensemble',         desc: 'Our choir, marimba group, and ensemble performers bring music to every school event and cultural celebration.' },
  { icon: FaGlobeAfrica,   name: 'Traditional Dance',      desc: 'Shona traditional dance is celebrated and performed at cultural events, connecting students to their heritage.' },
  { icon: FaComments,      name: 'Debate & Public Speaking',desc: 'Our debate team has won regional championships. Students develop articulate, confident, critical voices.' },
  { icon: FaPalette,       name: 'Fine Arts & Crafts',     desc: 'The Art Studio is a hub of creativity, with students exhibiting work at the annual art showcase.' },
  { icon: FaStar,          name: 'Cultural Day',            desc: 'Our annual Cultural Day is a vibrant celebration of Zimbabwe\'s diverse heritage — music, dance, food, and attire.' },
]

const FACILITIES = [
  { name: 'Classrooms',            img: classroomImg,    desc: 'Modern, well-equipped classrooms designed for focused learning and interactive teaching.' },
  { name: 'School Library',        img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80', desc: 'Over 5,000 volumes plus digital resources for research and reading.' },
  { name: 'Computer Laboratory',   img: computerLabImg,  desc: '40-station computer lab with reliable internet access and the latest software.' },
  { name: 'Sports Fields',         img: soccerImg,       desc: 'Full-size football pitch, athletics track, and multi-use courts for sport every day.' },
  { name: 'Community Engagement',  img: communityImg,    desc: 'Students regularly engage with the broader Checheche community through service activities.' },
  { name: 'School Campus',         img: oasisImg,        desc: 'Our welcoming campus — a place where every student belongs and every day counts.' },
]

const SCHEDULE = [
  { time: '6:30 AM',   activity: 'Gates open — morning study sessions begin' },
  { time: '7:45 AM',   activity: 'Morning assembly' },
  { time: '8:00 AM',   activity: 'Classes begin (8 periods per day)' },
  { time: '10:30 AM',  activity: 'Morning break — tuck shop open' },
  { time: '1:00 PM',   activity: 'Lunch break' },
  { time: '1:40 PM',   activity: 'Afternoon classes resume' },
  { time: '3:30 PM',   activity: 'School day ends' },
  { time: '3:45 PM',   activity: 'After-school activities begin (sport, clubs, tutorials)' },
  { time: '5:00 PM',   activity: 'After-school activities close' },
  { time: '5:30 PM',   activity: 'Gates close' },
]

export default function CampusLife() {
  return (
    <>
      <PageHero
        title="Campus Life"
        subtitle="Where sport, culture, friendship, and achievement come together every day."
        breadcrumb={[{ label: 'Campus Life' }]}
        image={soccerImg}
      />

      {/* Sport intro */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle
            label="Sport at Oasis"
            title="Champions On & Off The Field"
            subtitle="We believe sport builds character as much as the classroom. Every student is encouraged to compete, improve, and discover their sporting passion."
          />

          <div className="bg-navy rounded-2xl p-8 mb-14 text-center">
            <p className="font-playfair italic text-xl text-gray-200 max-w-3xl mx-auto">
              "Sport is not an extra-curricular activity at Oasis — it is a cornerstone of our educational philosophy. We develop the whole person: mind, body, and spirit."
            </p>
            <p className="font-montserrat text-gold text-xs uppercase tracking-widest mt-4">School Philosophy</p>
          </div>

          <div className="mb-12">
            <h3 className="font-playfair text-2xl font-bold text-navy mb-8 flex items-center gap-3">
              <FaTrophy className="text-gold" /> Team Sports
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEAM_SPORTS.map(({ icon: Icon, name, desc }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gold/50 hover:shadow-xl transition-all duration-300 group"
                >
                  <Icon className="text-gold text-3xl mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-playfair font-bold text-navy text-lg mb-2">{name}</h4>
                  <p className="text-slate text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-playfair text-2xl font-bold text-navy mb-8 flex items-center gap-3">
              <FaRunning className="text-gold" /> Individual Sports
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {IND_SPORTS.map(({ icon: Icon, name, desc }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gold/50 hover:shadow-xl transition-all duration-300 group"
                >
                  <Icon className="text-gold text-3xl mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-playfair font-bold text-navy text-lg mb-2">{name}</h4>
                  <p className="text-slate text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SPORTS EVENTS & COMPETITIONS ── */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle
            label="Sports Events"
            title="Competitions & Tournaments"
            subtitle="Oasis Private College competes actively in inter-school tournaments, district championships, and national competitions. Our athletes represent the school with pride, discipline, and a winning spirit."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[
              { icon: FaTrophy,      name: 'Inter-School Tournaments', desc: 'Annual inter-school competitions across football, netball, athletics, and debate — putting our students against the best in Manicaland.' },
              { icon: FaMedal,       name: 'District Championships',    desc: 'Chipinge District competitions where Oasis athletes regularly claim top honours in track, field, and team sport events.' },
              { icon: FaRunning,     name: 'Annual Sports Day',          desc: 'The crown jewel of the Oasis sporting calendar. All four houses compete in a full day of athletics, relays, and field events.' },
              { icon: FaStar,        name: 'National Competitions',     desc: 'Our top athletes and sports teams have represented at national level, flying the Oasis flag with distinction and pride.' },
              { icon: FaHandshake,   name: 'Friendly Fixtures',          desc: 'Regular friendly matches against neighbouring schools building sportsmanship, relationship, and competitive experience year-round.' },
              { icon: FaAward,       name: 'Prize Giving & Awards',     desc: 'The annual Sports Prize Giving celebrates our champions — acknowledging excellence, commitment, and the spirit that defines Oasis sport.' },
            ].map(({ icon: Icon, name, desc }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09 }}
                className="bg-navy rounded-2xl p-7 border border-teal-500/30 hover:border-teal-400/60 hover:shadow-xl hover:shadow-teal-900/20 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-center mb-5 group-hover:bg-teal-500/20 transition-colors">
                  <Icon className="text-teal-400 text-xl" />
                </div>
                <h4 className="font-playfair font-bold text-white text-lg mb-2 group-hover:text-teal-300 transition-colors">{name}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports Day feature */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${soccerImg})` }} />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <FaTrophy className="text-teal-400 text-5xl mx-auto mb-5" />
            <span className="inline-block font-montserrat text-xs font-semibold uppercase tracking-[0.2em] text-teal-400 border border-teal-500/40 px-4 py-1.5 rounded-full mb-5">
              Sports Events
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">Annual Sports Day</h2>
            <span className="block w-16 h-1 bg-teal-500 rounded-full mx-auto mt-4" />
            <p className="mt-6 text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              The highlight of the sporting calendar. All four houses — Zambezi, Limpopo, Runde, and Save — compete in a full day of athletics, relays, field events, and fun activities. Parents, guardians, and the wider Checheche community are warmly invited.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {[{ label: '4 Houses', sub: 'Competing for glory' }, { label: '20+ Events', sub: 'Track, field & fun' }, { label: 'Whole Community', sub: 'Parents welcome' }].map(({ label, sub }) => (
                <div key={label} className="bg-white/5 border border-teal-500/20 rounded-xl px-8 py-5 text-center">
                  <div className="font-playfair text-2xl font-bold text-teal-400">{label}</div>
                  <div className="font-montserrat text-gray-400 text-xs uppercase tracking-wider mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cultural Activities */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle
            label="Arts & Culture"
            title="Cultural Life at Oasis"
            subtitle="Beyond sport, our students express themselves through drama, music, dance, debate, and the arts — celebrating Zimbabwe's rich cultural heritage."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CULTURE.map(({ icon: Icon, name, desc }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-6 bg-cream rounded-2xl border border-gray-100 hover:border-gold/50 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold transition-colors duration-300">
                  <Icon className="text-gold text-xl group-hover:text-navy transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="font-playfair font-bold text-navy text-lg mb-1">{name}</h4>
                  <p className="text-slate text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="section-padding bg-cream">
        <div className="container-max">
          <SectionTitle label="Our Campus" title="World-Class Facilities" subtitle="Every facility at Oasis is designed to inspire, equip, and empower our students." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FACILITIES.map(({ name, img, desc }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-gold/30"
              >
                <div className="h-44 overflow-hidden">
                  <img src={img} alt={name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h4 className="font-playfair font-bold text-navy text-base mb-1">{name}</h4>
                  <p className="text-slate text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Leadership */}
      <section className="section-padding bg-navy">
        <div className="container-max">
          <SectionTitle label="Student Voice" title="Student Leadership" light />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FaUsers, title: 'Student Representative Council',
                desc: 'The SRC is the official voice of the student body, representing student interests to school management and organising key school events throughout the year.' },
              { icon: FaStar, title: 'Prefect System',
                desc: 'A tradition of peer leadership. Head Prefects, Deputy Heads, and House Prefects are appointed based on academic excellence, character, and service.' },
              { icon: FaBookOpen, title: 'Leadership Development',
                desc: 'We believe leadership is learned. Through formal programmes, mentorship, and responsibility, every student discovers their capacity to lead and serve.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white/5 border border-white/10 hover:border-gold/40 rounded-2xl p-8 transition-all duration-300"
              >
                <Icon className="text-gold text-3xl mb-4" />
                <h3 className="font-playfair text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionTitle label="Day School Life" title="The Daily Schedule" subtitle="A structured, energising day that balances learning, sport, culture, and personal growth." />
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute left-[55px] top-4 bottom-4 w-px bg-gold/20" />
              <div className="space-y-4">
                {SCHEDULE.map(({ time, activity }, i) => (
                  <motion.div
                    key={time}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-6 items-center"
                  >
                    <div className="flex-shrink-0 w-24 text-right pr-4">
                      <span className="font-montserrat text-xs font-bold text-gold">{time}</span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-navy border-2 border-gold flex-shrink-0 relative z-10" />
                    <div className="flex-1 bg-cream rounded-xl px-4 py-3 border border-gray-100 hover:border-gold/30 transition-colors">
                      <p className="text-slate text-sm">{activity}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="mt-8 bg-gold/10 border border-gold/30 rounded-xl p-5 flex items-start gap-3">
              <FaClock className="text-gold text-xl flex-shrink-0 mt-0.5" />
              <p className="text-navy text-sm leading-relaxed">
                <strong>Day School Note:</strong> Oasis Private College is a day school. Gates open at <strong>6:30 AM</strong> and close at <strong>5:30 PM</strong>, Monday to Friday. No weekend or holiday boarding.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
