import { useState } from 'react'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import NewsCard from '../components/NewsCard'

const ALL_NEWS = [
  {
    id: '1', category: 'Achievements', date: '12 May 2026',
    title: 'Oasis Students Shine at 2025 Cambridge O-Level Results',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&q=80',
    excerpt: 'Oasis Private College celebrates another exceptional year of Cambridge O-Level results, with 95% of candidates achieving five or more passes including English and Mathematics.',
  },
  {
    id: '2', category: 'News', date: '5 May 2026',
    title: 'Oasis Opens State-of-the-Art Computer Laboratory',
    image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=700&q=80',
    excerpt: 'The school has officially commissioned a brand new 40-station computer laboratory, equipped with the latest hardware and high-speed internet access for all students.',
  },
  {
    id: '3', category: 'Events', date: '28 April 2026',
    title: 'Annual Sports Day 2026 — A Day of Champions',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=700&q=80',
    excerpt: 'Over 500 students, parents, and community members gathered for Oasis Annual Sports Day 2026. Zambezi House claimed the overall trophy in a thrilling final day of competition.',
  },
  {
    id: '4', category: 'Achievements', date: '20 April 2026',
    title: 'Debate Team Claims Regional Championship',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=700&q=80',
    excerpt: 'The Oasis Debate Team has won the Manicaland Regional Schools Debate Championship for the second consecutive year, defeating 14 other schools in the final.',
  },
  {
    id: '5', category: 'Events', date: '10 April 2026',
    title: 'Open Day 2026 Welcomes Over 200 Prospective Families',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&q=80',
    excerpt: 'Oasis Private College\'s annual Open Day drew a record 200+ prospective families. Visitors toured the campus, attended subject demos, and met the leadership team.',
  },
  {
    id: '6', category: 'News', date: '2 April 2026',
    title: 'Oasis Launches New STEM Innovation Programme',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=700&q=80',
    excerpt: 'Oasis introduces a groundbreaking STEM Innovation Programme for Forms 2 and 3, providing hands-on experience in robotics, coding, and design thinking.',
  },
]

const FILTERS = ['All', 'News', 'Events', 'Achievements']

export default function News() {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All' ? ALL_NEWS : ALL_NEWS.filter(n => n.category === filter)

  return (
    <>
      <PageHero
        title="News & Updates"
        subtitle="The latest from Oasis Private College — achievements, events, and school life."
        breadcrumb={[{ label: 'News' }]}
        image="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80"
      />

      <section className="section-padding bg-cream">
        <div className="container-max">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <SectionTitle label="Latest" title="News & Stories" align="left" />
            <div className="flex flex-wrap gap-2 pb-2">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-200 ${
                    filter === f
                      ? 'bg-navy text-white shadow-lg'
                      : 'bg-white text-slate hover:bg-gold/10 hover:text-navy border border-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item, i) => (
              <NewsCard key={item.id} item={item} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-slate-light py-16">No articles in this category yet.</p>
          )}
        </div>
      </section>
    </>
  )
}
