import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  MdSave, MdCloudUpload, MdDelete, MdAdd, MdEdit, MdCheck, MdClose,
  MdImage, MdFormatQuote, MdStar, MdBarChart, MdHome, MdInfo, MdCampaign, MdTaskAlt,
} from 'react-icons/md'
import { getHomepageContent, saveHomepageSection, uploadContentImage, deleteContentImage } from '../../firebase/websiteContent'
import { DEFAULTS } from '../../hooks/useHomepageContent'

// ─── helpers ────────────────────────────────────────────────────────────────

function deepClone(v) { return JSON.parse(JSON.stringify(v)) }

function ImageUploader({ label, currentUrl, onUploaded, slot }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    const tid = toast.loading('Uploading image…')
    try {
      const { url, path } = await uploadContentImage(file, slot)
      onUploaded(url, path)
      toast.success('Image uploaded', { id: tid })
    } catch {
      toast.error('Upload failed', { id: tid })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-start gap-4">
        {currentUrl ? (
          <div className="relative shrink-0">
            <img src={currentUrl} alt={label} className="w-32 h-20 object-cover rounded-lg border border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => inputRef.current?.click()}>
              <MdEdit className="text-white text-xl" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-32 h-20 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-gold/50 hover:text-gold transition-all"
          >
            <MdCloudUpload size={20} />
            <span className="text-[10px] font-montserrat">Upload</span>
          </button>
        )}
        <div className="text-xs text-gray-500 leading-relaxed mt-1">
          {currentUrl ? <span className="text-green-400 font-medium">✓ Image set</span> : <span>No image — using default</span>}
          <br />JPG, PNG or WebP recommended
          {currentUrl && (
            <button onClick={() => inputRef.current?.click()} className="block mt-1 text-gold hover:underline">
              Replace image
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

// ─── Field ───────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline = false, placeholder = '' }) {
  const cls = 'w-full bg-navy border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50'
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {multiline
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

function SaveBar({ onSave, saving }) {
  return (
    <div className="flex justify-end pt-3 border-t border-white/10 mt-6">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 bg-gold hover:bg-[#D4B96A] text-navy font-bold text-sm font-montserrat px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
      >
        <MdSave size={16} />
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ─── tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hero',         label: 'Hero',           icon: MdHome        },
  { id: 'stats',        label: 'Stats',          icon: MdBarChart    },
  { id: 'about',        label: 'About',          icon: MdInfo        },
  { id: 'programs',     label: 'Programs',       icon: MdStar        },
  { id: 'whyChooseUs',  label: 'Why Choose Us',  icon: MdTaskAlt     },
  { id: 'testimonials', label: 'Testimonials',   icon: MdFormatQuote },
  { id: 'cta',          label: 'CTA Banner',     icon: MdCampaign    },
]

// ─── section editors ─────────────────────────────────────────────────────────

function HeroEditor({ data, onChange, onSave, saving }) {
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-5">
      <Field label="Badge text (top pill)" value={data.badge} onChange={v => set('badge', v)} placeholder="Welcome to School Name · Location" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Headline" value={data.headline} onChange={v => set('headline', v)} placeholder="Where Excellence" />
        <Field label="Headline accent (gold)" value={data.headlineAccent} onChange={v => set('headlineAccent', v)} placeholder="Flows" />
      </div>
      <Field label="Tagline / subtitle" value={data.tagline} onChange={v => set('tagline', v)} multiline placeholder="A premier day school…" />
      <Field label="Admissions year (button label)" value={data.ctaYear} onChange={v => set('ctaYear', v)} placeholder="2027" />
      <ImageUploader
        label="Hero background image"
        currentUrl={data.imageUrl}
        slot="hero"
        onUploaded={(url, path) => onChange({ ...data, imageUrl: url, imagePath: path })}
      />
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function StatsEditor({ data, onChange, onSave, saving }) {
  const update = (i, k, v) => {
    const next = data.map((s, idx) => idx === i ? { ...s, [k]: v } : s)
    onChange(next)
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">These 4 numbers appear in the dark bar below the hero image.</p>
      {data.map((stat, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 p-4 bg-navy rounded-lg border border-white/10">
          <Field label="Number" value={stat.value} onChange={v => update(i, 'value', v)} placeholder="500" />
          <Field label="Suffix" value={stat.suffix} onChange={v => update(i, 'suffix', v)} placeholder="+" />
          <Field label="Label" value={stat.label} onChange={v => update(i, 'label', v)} placeholder="Students Enrolled" />
        </div>
      ))}
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function AboutEditor({ data, onChange, onSave, saving }) {
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-5">
      <Field label="Section label (small text above title)" value={data.sectionLabel} onChange={v => set('sectionLabel', v)} placeholder="Our Story" />
      <Field label="Title" value={data.title} onChange={v => set('title', v)} placeholder="A Legacy of Academic Excellence in…" />
      <Field label="First paragraph" value={data.body1} onChange={v => set('body1', v)} multiline />
      <Field label="Second paragraph" value={data.body2} onChange={v => set('body2', v)} multiline />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Badge label (e.g. Day School)" value={data.badge1} onChange={v => set('badge1', v)} />
        <Field label="Badge detail (e.g. hours)" value={data.badge2} onChange={v => set('badge2', v)} />
      </div>
      <ImageUploader
        label="About section image"
        currentUrl={data.imageUrl}
        slot="about"
        onUploaded={(url, path) => onChange({ ...data, imageUrl: url, imagePath: path })}
      />
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function ProgramsEditor({ data, onChange, onSave, saving }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', subjects: '' })

  const startEdit = (i) => {
    setEditing(i)
    setForm(i === 'new' ? { title: '', description: '', subjects: '' } : { ...data[i] })
  }
  const cancel = () => { setEditing(null) }
  const save = () => {
    if (!form.title.trim()) return
    if (editing === 'new') {
      onChange([...data, form])
    } else {
      onChange(data.map((p, i) => i === editing ? form : p))
    }
    setEditing(null)
  }
  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Programs shown in the "Our Programmes" section. Add/edit/remove to match this school's curriculum.</p>

      {data.map((p, i) => (
        <div key={i} className="flex items-start gap-3 p-4 bg-navy rounded-lg border border-white/10">
          {editing === i ? (
            <div className="flex-1 space-y-3">
              <input className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <textarea rows={2} className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <input className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Subjects (comma separated)" value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={save} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded"><MdCheck size={14} />Save</button>
                <button onClick={cancel} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-gray-300 text-xs px-3 py-1.5 rounded"><MdClose size={14} />Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white font-playfair">{p.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                <p className="text-[10px] text-gold/70 mt-1">{p.subjects}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => startEdit(i)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition"><MdEdit size={15} /></button>
                <button onClick={() => remove(i)} className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition"><MdDelete size={15} /></button>
              </div>
            </>
          )}
        </div>
      ))}

      {editing === 'new' ? (
        <div className="p-4 bg-navy rounded-lg border border-gold/30 space-y-3">
          <input className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Program title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea rows={2} className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Subjects (comma separated)" value={form.subjects} onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded"><MdCheck size={14} />Add</button>
            <button onClick={cancel} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-gray-300 text-xs px-3 py-1.5 rounded"><MdClose size={14} />Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => startEdit('new')} className="flex items-center gap-2 border border-dashed border-white/20 hover:border-gold/50 text-gray-500 hover:text-gold text-sm font-montserrat px-4 py-3 rounded-lg w-full justify-center transition-all">
          <MdAdd size={18} /> Add Program
        </button>
      )}

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function TestimonialsEditor({ data, onChange, onSave, saving }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ quote: '', name: '', role: '' })

  const startEdit = (i) => {
    setEditing(i)
    setForm(i === 'new' ? { quote: '', name: '', role: '' } : { ...data[i] })
  }
  const cancel = () => setEditing(null)
  const save = () => {
    if (!form.quote.trim() || !form.name.trim()) return
    if (editing === 'new') onChange([...data, form])
    else onChange(data.map((t, i) => i === editing ? form : t))
    setEditing(null)
  }
  const remove = (i) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Quotes from parents, alumni or current students shown on the homepage.</p>

      {data.map((t, i) => (
        <div key={i} className="p-4 bg-navy rounded-lg border border-white/10">
          {editing === i ? (
            <div className="space-y-3">
              <textarea rows={3} className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Quote" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Role (e.g. Parent · Form 4)" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={save} className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded"><MdCheck size={14} />Save</button>
                <button onClick={cancel} className="flex items-center gap-1 bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded"><MdClose size={14} />Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 italic line-clamp-2">"{t.quote}"</p>
                <p className="text-xs font-semibold text-white mt-1.5">{t.name}</p>
                <p className="text-[10px] text-gold/70">{t.role}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => startEdit(i)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"><MdEdit size={15} /></button>
                <button onClick={() => remove(i)} className="p-1.5 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400"><MdDelete size={15} /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      {editing === 'new' ? (
        <div className="p-4 bg-navy rounded-lg border border-gold/30 space-y-3">
          <textarea rows={3} className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Quote" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="bg-navy-800 border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded"><MdCheck size={14} />Add</button>
            <button onClick={cancel} className="flex items-center gap-1 bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded"><MdClose size={14} />Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => startEdit('new')} className="flex items-center gap-2 border border-dashed border-white/20 hover:border-gold/50 text-gray-500 hover:text-gold text-sm font-montserrat px-4 py-3 rounded-lg w-full justify-center transition-all">
          <MdAdd size={18} /> Add Testimonial
        </button>
      )}

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function CtaEditor({ data, onChange, onSave, saving }) {
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">The gold banner at the bottom of the homepage.</p>
      <Field label="Admissions year" value={data.year} onChange={v => set('year', v)} placeholder="2027" />
      <Field label="Headline" value={data.headline} onChange={v => set('headline', v)} placeholder="Applications for 2027 Are Now Open" />
      <Field label="Body text" value={data.body} onChange={v => set('body', v)} multiline />
      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function WhyChooseUsEditor({ data, onChange, onSave, saving }) {
  const setHeader = (k, v) => onChange({ ...data, [k]: v })
  const updateFeature = (i, k, v) => {
    const next = data.features.map((f, idx) => idx === i ? { ...f, [k]: v } : f)
    onChange({ ...data, features: next })
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-4">
        <p className="text-xs text-gray-500 font-montserrat uppercase tracking-wider font-semibold">Section Header</p>
        <Field label="Section label (small text above title)" value={data.label}    onChange={v => setHeader('label', v)}    placeholder="Why Choose Us" />
        <Field label="Title"                                  value={data.title}    onChange={v => setHeader('title', v)}    placeholder="The Oasis Difference" />
        <Field label="Subtitle"                               value={data.subtitle} onChange={v => setHeader('subtitle', v)} multiline placeholder="Excellence is not accidental…" />
      </div>

      <div className="border-t border-white/10" />

      {/* Feature items */}
      <p className="text-xs text-gray-500 font-montserrat uppercase tracking-wider font-semibold">Feature Items</p>
      {data.features.map((f, i) => (
        <div key={i} className="p-4 bg-navy rounded-lg border border-white/10 space-y-4">
          <p className="text-[10px] font-semibold text-gold uppercase tracking-widest font-montserrat">0{i + 1}</p>
          <Field label="Title" value={f.title} onChange={v => updateFeature(i, 'title', v)} placeholder="Feature title" />
          <Field label="Description" value={f.body} onChange={v => updateFeature(i, 'body', v)} multiline placeholder="Describe this feature…" />
          <ImageUploader
            label="Image (optional — uses default photo if empty)"
            currentUrl={f.imageUrl}
            slot={`why-choose-${i}`}
            onUploaded={(url, path) => {
              const next = data.features.map((ft, idx) => idx === i ? { ...ft, imageUrl: url, imagePath: path } : ft)
              onChange({ ...data, features: next })
            }}
          />
        </div>
      ))}

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function WebsiteContent() {
  const [tab, setTab]       = useState('hero')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [hero,         setHero]         = useState(deepClone(DEFAULTS.hero))
  const [stats,        setStats]        = useState(deepClone(DEFAULTS.stats))
  const [about,        setAbout]        = useState(deepClone(DEFAULTS.about))
  const [programs,     setPrograms]     = useState(deepClone(DEFAULTS.programs))
  const [whyChooseUs,  setWhyChooseUs]  = useState(deepClone(DEFAULTS.whyChooseUs))
  const [testimonials, setTestimonials] = useState(deepClone(DEFAULTS.testimonials))
  const [cta,          setCta]          = useState(deepClone(DEFAULTS.cta))

  useEffect(() => {
    getHomepageContent().then(remote => {
      if (!remote) { setLoaded(true); return }
      if (remote.hero)         setHero(r => ({ ...r, ...remote.hero }))
      if (remote.stats?.length) setStats(remote.stats)
      if (remote.about)        setAbout(r => ({ ...r, ...remote.about }))
      if (remote.programs?.length) setPrograms(remote.programs)
      if (remote.whyChooseUs)  setWhyChooseUs(r => ({
        ...r, ...remote.whyChooseUs,
        features: remote.whyChooseUs.features?.length ? remote.whyChooseUs.features : r.features,
      }))
      if (remote.testimonials?.length) setTestimonials(remote.testimonials)
      if (remote.cta)          setCta(r => ({ ...r, ...remote.cta }))
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const save = async (section, data) => {
    setSaving(true)
    try {
      await saveHomepageSection(section, data)
      toast.success('Saved — live on the website instantly')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    )
  }

  const tabContent = {
    hero:         <HeroEditor          data={hero}         onChange={setHero}         onSave={() => save('hero', hero)}                   saving={saving} />,
    stats:        <StatsEditor         data={stats}        onChange={setStats}        onSave={() => save('stats', stats)}                 saving={saving} />,
    about:        <AboutEditor         data={about}        onChange={setAbout}        onSave={() => save('about', about)}                 saving={saving} />,
    programs:     <ProgramsEditor      data={programs}     onChange={setPrograms}     onSave={() => save('programs', programs)}           saving={saving} />,
    whyChooseUs:  <WhyChooseUsEditor   data={whyChooseUs}  onChange={setWhyChooseUs}  onSave={() => save('whyChooseUs', whyChooseUs)}    saving={saving} />,
    testimonials: <TestimonialsEditor  data={testimonials} onChange={setTestimonials} onSave={() => save('testimonials', testimonials)}  saving={saving} />,
    cta:          <CtaEditor           data={cta}          onChange={setCta}          onSave={() => save('cta', cta)}                    saving={saving} />,
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Info banner */}
      <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 text-sm text-gold/90 font-montserrat">
        Changes save directly to Firestore and go live on the website immediately — no code changes or deployments needed.
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-navy border border-white/10 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold font-montserrat uppercase tracking-wider transition-all ${
              tab === id
                ? 'bg-gold text-navy'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="bg-navy-800 rounded-xl border border-white/10 p-6">
        {tabContent[tab]}
      </div>
    </div>
  )
}
