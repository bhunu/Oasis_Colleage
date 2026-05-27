import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(
  readFileSync(
    'C:/Users/NorestMabhunu/Downloads/Projects/oasis-818f2-firebase-adminsdk-fbsvc-613726e2ac.json',
    'utf8'
  )
)

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

// ─── Helpers ───────────────────────────────────────────────────────────────
async function clearCollection(collectionName) {
  const snap = await db.collection(collectionName).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  console.log(`  🗑  Cleared ${snap.size} existing doc(s) from "${collectionName}"`)
}

async function seed(collectionName, docs) {
  await clearCollection(collectionName)
  console.log(`  Seeding "${collectionName}"...`)
  const col = db.collection(collectionName)
  const results = []
  for (const data of docs) {
    const ref = await col.add(data)
    console.log(`  ✓ ${ref.id}  —  ${data.name ?? data.title ?? data.content?.slice(0, 40)}`)
    results.push({ id: ref.id, ...data })
  }
  return results
}

// ─── Data ──────────────────────────────────────────────────────────────────

const now = Timestamp.now()

const users = [
  {
    name:      'Mr. T. Mabhunu',
    email:     'director@oasiscollege.ac.zw',
    role:      'admin',
    title:     'School Director',
    phone:     '+263 77 123 4567',
    active:    true,
    createdAt: now,
  },
  {
    name:      'Mrs. R. Choto',
    email:     'r.choto@oasiscollege.ac.zw',
    role:      'teacher',
    title:     'Senior Geography Teacher',
    subject:   'Geography',
    active:    true,
    createdAt: now,
  },
  {
    name:      'Mr. S. Mutasa',
    email:     's.mutasa@oasiscollege.ac.zw',
    role:      'teacher',
    title:     'Mathematics Teacher',
    subject:   'Mathematics',
    active:    true,
    createdAt: now,
  },
  {
    name:      'Ms. P. Zimba',
    email:     'p.zimba@oasiscollege.ac.zw',
    role:      'teacher',
    title:     'English Language Teacher',
    subject:   'English',
    active:    true,
    createdAt: now,
  },
  {
    name:          'Tendai Moyo',
    username:      'tendai.moyo22',
    role:          'student',
    form:          'Form 4',
    admissionYear: 2022,
    active:        true,
    createdAt:     now,
  },
  {
    name:          'Chiedza Nhamo',
    username:      'chiedza.nhamo21',
    role:          'student',
    form:          'Lower 6',
    admissionYear: 2021,
    active:        true,
    createdAt:     now,
  },
  {
    name:          'Tatenda Chirwa',
    username:      'tatenda.chirwa25',
    role:          'student',
    form:          'Form 1',
    admissionYear: 2025,
    active:        true,
    createdAt:     now,
  },
]

const posts = [
  {
    title:     'Welcome Back — 2026 Academic Year Begins',
    content:   'Oasis Private College warmly welcomes all students, staff, and parents to the 2026 academic year. This year promises to be filled with academic excellence, sporting achievements, and community growth. Let us work together to make it our best year yet.',
    category:  'Announcement',
    author:    'Mr. T. Mabhunu',
    pinned:    true,
    published: true,
    createdAt: now,
  },
  {
    title:     'A-Level Results 2025 — Outstanding Performance',
    content:   'We are proud to announce that our Upper 6 class of 2025 achieved a 94% pass rate in the November A-Level examinations. Three students scored straight As, earning university scholarships. Congratulations to all students and teachers involved.',
    category:  'News',
    author:    'Mr. T. Mabhunu',
    pinned:    false,
    published: true,
    createdAt: now,
  },
  {
    title:     'Inter-School Football Tournament — Oasis Triumphs',
    content:   'Our senior football team brought home the Checheche Inter-School trophy after a thrilling final against St. Andrews High. The team showed exceptional teamwork and determination throughout the tournament.',
    category:  'Sports',
    author:    'Mrs. R. Choto',
    pinned:    false,
    published: true,
    createdAt: now,
  },
  {
    title:     'New Computer Lab Now Open',
    content:   'We are excited to announce the opening of our upgraded computer laboratory, equipped with 30 modern workstations and high-speed internet. Students can now access digital learning resources and develop essential ICT skills.',
    category:  'Infrastructure',
    author:    'Mr. T. Mabhunu',
    pinned:    false,
    published: true,
    createdAt: now,
  },
  {
    title:     'Community Clean-Up Day — Saturday 6 June',
    content:   'All students and staff are invited to participate in our annual community clean-up exercise around the Checheche area. Please arrive by 7:00 AM in school uniform. This is a compulsory activity for Form 3 and above.',
    category:  'Community',
    author:    'Ms. P. Zimba',
    pinned:    false,
    published: true,
    createdAt: now,
  },
]

const buildComments = (seededPosts, seededUsers) => {
  const postMap   = Object.fromEntries(seededPosts.map(p => [p.title.slice(0, 20), p.id]))
  const userMap   = Object.fromEntries(seededUsers.map(u => [u.name.split(' ')[0], u.name]))

  return [
    {
      postId:    seededPosts[0].id,
      postTitle: seededPosts[0].title,
      author:    userMap['Tendai'] ?? 'Tendai Moyo',
      content:   'So excited for the new year! Looking forward to sitting my O-Levels.',
      createdAt: now,
    },
    {
      postId:    seededPosts[0].id,
      postTitle: seededPosts[0].title,
      author:    userMap['Chiedza'] ?? 'Chiedza Nhamo',
      content:   'Can\'t wait to see all my friends again. The new timetable looks great.',
      createdAt: now,
    },
    {
      postId:    seededPosts[1].id,
      postTitle: seededPosts[1].title,
      author:    userMap['Mrs.'] ?? 'Mrs. R. Choto',
      content:   'Congratulations to all the students — hard work truly pays off!',
      createdAt: now,
    },
    {
      postId:    seededPosts[1].id,
      postTitle: seededPosts[1].title,
      author:    userMap['Chiedza'] ?? 'Chiedza Nhamo',
      content:   'I hope to follow in their footsteps this coming November. Let\'s go Upper 6!',
      createdAt: now,
    },
    {
      postId:    seededPosts[2].id,
      postTitle: seededPosts[2].title,
      author:    userMap['Tatenda'] ?? 'Tatenda Chirwa',
      content:   'I was there cheering — the team was amazing in the final!',
      createdAt: now,
    },
    {
      postId:    seededPosts[3].id,
      postTitle: seededPosts[3].title,
      author:    userMap['Tendai'] ?? 'Tendai Moyo',
      content:   'The new computers are super fast. ICT lessons are much more fun now.',
      createdAt: now,
    },
    {
      postId:    seededPosts[4].id,
      postTitle: seededPosts[4].title,
      author:    userMap['Ms.'] ?? 'Ms. P. Zimba',
      content:   'Remember to bring gloves and wear comfortable shoes on Saturday.',
      createdAt: now,
    },
  ]
}

// ─── Run ───────────────────────────────────────────────────────────────────
;(async () => {
  try {
    console.log('\nusers:')
    const seededUsers = await seed('users', users)
    console.log('\nposts:')
    const seededPosts = await seed('posts', posts)
    console.log('\ncomments:')
    const comments    = buildComments(seededPosts, seededUsers)
    await seed('comments', comments)

    console.log('\n✅  Firestore seeded successfully!')
    console.log(`   users:    ${seededUsers.length} documents`)
    console.log(`   posts:    ${seededPosts.length} documents`)
    console.log(`   comments: ${comments.length} documents`)
    process.exit(0)
  } catch (err) {
    console.error('\n❌  Seeding failed:', err.message)
    process.exit(1)
  }
})()
