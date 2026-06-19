import { useState, useEffect } from 'react'
import { getHomepageContent } from '../firebase/websiteContent'

// Defaults match current hardcoded values — if Firestore has nothing, page looks identical
export const DEFAULTS = {
  hero: {
    badge:          'Welcome to Oasis Private College · Checheche, Zimbabwe',
    headline:       'Where Excellence',
    headlineAccent: 'Flows',
    tagline:        "A premier day school shaping Zimbabwe's future leaders through knowledge, character, and excellence.",
    imageUrl:       '',
    imagePath:      '',
    ctaYear:        '2027',
  },
  stats: [
    { value: '500', suffix: '+', label: 'Students Enrolled'   },
    { value: '95',  suffix: '%', label: 'ZIMSEC Pass Rate'    },
    { value: '40',  suffix: '+', label: 'Subjects Offered'    },
    { value: '12',  suffix: '',  label: 'Years of Excellence' },
  ],
  about: {
    sectionLabel: 'Our Story',
    title:        'A Legacy of Academic Excellence in Checheche',
    body1:        "Oasis Private College stands as Checheche's premier educational institution — a beacon of academic rigour, moral integrity, and community spirit nestled in the heart of Manicaland. Since our founding, we have nurtured hundreds of Zimbabwe's brightest young minds.",
    body2:        'As a day school, we believe education thrives when home and school work in partnership. Our students arrive each morning energised by family, and leave each afternoon enriched by learning, friendship, and achievement.',
    imageUrl:     '',
    imagePath:    '',
    badge1:       'Day School',
    badge2:       '6:30 AM – 5:30 PM',
  },
  programs: [
    { title: 'Cambridge O-Level', description: 'Rigorous IGCSE and O-Level programmes preparing students for university entry with a broad curriculum spanning Sciences, Humanities, Commerce and the Arts.', subjects: 'English, Mathematics, Sciences, History' },
    { title: 'Cambridge A-Level', description: 'Advanced Level studies with focused depth in chosen subjects. Our A-Level students consistently achieve outstanding results and gain entry to top universities.', subjects: 'Sciences, Commerce, Humanities, Languages' },
    { title: 'STEM & Sciences',   description: 'State-of-the-art laboratories and dedicated STEM teachers inspire curiosity and critical thinking. Practical investigation is at the core of every science lesson.', subjects: 'Biology, Chemistry, Physics, Computing' },
    { title: 'Arts & Commerce',   description: 'From Accounts to Fine Art, our Arts and Commerce stream develops creative thinkers and future business leaders through real-world application.', subjects: 'Accounts, Business, Art, Literature' },
  ],
  testimonials: [
    { quote: 'Oasis Private College gave my daughter more than an education — it gave her confidence, discipline, and a love of learning. The teachers genuinely care about every child\'s future.', name: 'Mrs. Tendai Mutasa',  role: 'Parent · Form 4 Student' },
    { quote: 'The O-Level results I achieved at Oasis opened doors I never thought possible. The standard of teaching here rivals any school in Zimbabwe — absolutely world-class.',              name: 'Farai Chikwanda',    role: 'Alumnus · University of Zimbabwe' },
    { quote: 'What makes Oasis special is the community. You are not just a student here — you are part of a family. The sport, the drama, the friendships — I wouldn\'t trade it for anything.',  name: 'Blessing Moyo',      role: 'Current Student · Form 3' },
  ],
  whyChooseUs: {
    label:    'Why Choose Us',
    title:    'The Oasis Difference',
    subtitle: 'Excellence is not accidental — it is the result of deliberate design, passionate teaching, and a community that lifts every student higher.',
    features: [
      { title: 'World-Class Facilities',       body: 'Our campus features fully equipped science laboratories, a modern computer lab, a well-stocked library, dedicated art and music rooms, and expansive sports fields — all designed to inspire learning and growth.', imageUrl: '', imagePath: '' },
      { title: 'Expert & Dedicated Faculty',   body: "Every teacher at Oasis Private College is a qualified, passionate professional committed to each student's success. Small class sizes ensure personalised attention and meaningful teacher-student relationships.", imageUrl: '', imagePath: '' },
      { title: 'Vibrant Day School Community', body: 'As a day school, students bring the energy of home into every day at Oasis. From morning assembly to after-school activities, every day is rich with sport, culture, debate, music, and peer connection.', imageUrl: '', imagePath: '' },
    ],
  },
  sports: {
    headline:  'Champions On & Off The Field',
    subtitle:  'At Oasis, sport builds character as powerfully as the classroom. Our students compete, perform, debate, and create — every single day.',
    imageUrl:  '',
    imagePath: '',
  },
  cta: {
    year:     '2027',
    headline: 'Applications for 2027 Are Now Open',
    body:     "Join Oasis Private College — where every student finds their voice, their talent, and their future.",
  },
}

function merge(defaults, remote) {
  if (!remote) return defaults
  const result = { ...defaults }
  for (const key of Object.keys(defaults)) {
    if (remote[key] !== undefined) {
      if (Array.isArray(defaults[key])) {
        result[key] = remote[key].length > 0 ? remote[key] : defaults[key]
      } else if (typeof defaults[key] === 'object') {
        result[key] = { ...defaults[key], ...remote[key] }
      } else {
        result[key] = remote[key] || defaults[key]
      }
    }
  }
  return result
}

export function useHomepageContent() {
  const [content, setContent] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHomepageContent()
      .then(remote => setContent(merge(DEFAULTS, remote)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { content, loading }
}
