import { useState } from 'react'
import { motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import GalleryCard from '../components/GalleryCard'
import Lightbox from '../components/Lightbox'
import { useGallery } from '../hooks/useGallery'
import { FaImages } from 'react-icons/fa'

const CATEGORIES = ['all', 'sports', 'sports-events', 'cultural', 'academic', 'events', 'general']
const CAT_LABEL  = { all: 'All', sports: 'Sports', 'sports-events': 'Sports Events', cultural: 'Cultural', academic: 'Academic', events: 'Events', general: 'General' }

export default function Gallery() {
  const { photos, loading, getByCategory } = useGallery()
  const [activeCat, setActiveCat] = useState('all')
  const [lightbox, setLightbox]   = useState(null)

  const filtered       = getByCategory(activeCat)
  const lightboxIndex  = lightbox ? filtered.findIndex(p => p.id === lightbox.id) : -1
  const presentCats    = ['all', ...CATEGORIES.slice(1).filter(c => photos.some(p => p.category === c))]

  return (
    <>
      <PageHero
        title="Photo Gallery"
        subtitle="A window into life at Oasis Private College — sport, culture, academics, and events."
        breadcrumb={[{ label: 'Gallery' }]}
        image="https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?w=1920&q=80"
      />

      <section className="section-padding bg-cream">
        <div className="container-max">

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {presentCats.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`font-montserrat text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-200 ${
                  activeCat === cat
                    ? 'bg-navy text-white shadow-lg'
                    : 'bg-white text-slate hover:bg-gold/10 hover:text-navy border border-gray-200'
                }`}
              >
                {CAT_LABEL[cat]}{cat !== 'all' && !loading && ` (${getByCategory(cat).length})`}
              </button>
            ))}
          </div>

          {/* Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-light">
              <FaImages className="text-5xl mx-auto mb-4 opacity-30" />
              <p>No photos in this category yet.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GalleryCard photo={photo} onClick={() => setLightbox(photo)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Lightbox
        photo={lightbox}
        onClose={() => setLightbox(null)}
        onPrev={() => lightboxIndex > 0 && setLightbox(filtered[lightboxIndex - 1])}
        onNext={() => lightboxIndex < filtered.length - 1 && setLightbox(filtered[lightboxIndex + 1])}
        hasPrev={lightboxIndex > 0}
        hasNext={lightboxIndex < filtered.length - 1}
      />
    </>
  )
}
