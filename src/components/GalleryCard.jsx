import { FaExpand } from 'react-icons/fa'

const CAT_BADGE = {
  sports:          'bg-green-500',
  'sports-events': 'bg-teal-500',
  cultural:        'bg-yellow-500',
  academic:        'bg-blue-500',
  events:          'bg-purple-500',
  general:         'bg-gray-500',
}

const CAT_DISPLAY = {
  sports:          'Sports',
  'sports-events': 'Sports Events',
  cultural:        'Cultural',
  academic:        'Academic',
  events:          'Events',
  general:         'General',
}

export default function GalleryCard({ photo, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden bg-navy">
        <img
          src={photo.src}
          alt={photo.caption}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <p className="text-white text-sm font-sans leading-snug line-clamp-2">{photo.caption}</p>
        <div className="absolute top-4 right-4 w-8 h-8 bg-gold/90 rounded-full flex items-center justify-center">
          <FaExpand className="text-navy text-xs" />
        </div>
      </div>
      <div className="absolute top-3 left-3">
        <span className={`${CAT_BADGE[photo.category] || 'bg-gray-500'} text-white text-xs font-montserrat font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full`}>
          {CAT_DISPLAY[photo.category] || photo.category}
        </span>
      </div>
    </div>
  )
}
