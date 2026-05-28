import { useState, useEffect } from 'react'
import PageHero from '../components/PageHero'
import SectionTitle from '../components/SectionTitle'
import NewsCard from '../components/NewsCard'
import { getNews } from '../firebase/news'

const FILTERS = ['All', 'News', 'Events', 'Achievements', 'Academic', 'Sports', 'Community', 'Announcement']

export default function News() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')

  useEffect(() => {
    getNews()
      .then(setArticles)
      .catch(err => console.error('Failed to load news:', err))
      .finally(() => setLoading(false))
  }, [])

  const activeFilters = FILTERS.filter(f => f === 'All' || articles.some(a => a.category === f))
  const filtered = filter === 'All' ? articles : articles.filter(n => n.category === filter)

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
              {activeFilters.map(f => (
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-1/3" />
                    <div className="h-5 bg-gray-100 animate-pulse rounded" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-light py-16">No articles in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
