import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { MdSave, MdRefresh, MdPalette, MdEdit, MdDelete, MdAdd, MdRestorePage } from 'react-icons/md'
import { FaGraduationCap, FaCheckCircle } from 'react-icons/fa'
import { useBrand, DEFAULT_PRIMARY, DEFAULT_NAVY } from '../../context/BrandContext'
import { getPresets, savePresets } from '../../firebase/themeConfig'

// ─── Color math ───────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const n = hex.replace('#', '')
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

function mix(c, target, ratio) {
  return c.map((v, i) => Math.round(v * (1 - ratio) + target[i] * ratio))
}

// Return rgba string for inline styles
function alpha(hex, opacity) {
  try {
    const [r, g, b] = hexToRgb(hex)
    return `rgba(${r},${g},${b},${opacity})`
  } catch { return hex }
}

// Lighten a hex by mixing with white
function lighten(hex, pct) {
  try {
    return rgbToHex(...mix(hexToRgb(hex), [255, 255, 255], pct / 100))
  } catch { return hex }
}

// ─── HSL helpers for the hue slider ──────────────────────────────────────────

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

function hexToHue(hex) {
  try { return hexToHsl(hex)[0] } catch { return 0 }
}

function hueToHex(hue, currentHex) {
  try {
    const [, s, l] = hexToHsl(currentHex)
    return hslToHex(hue, Math.max(s, 45), Math.max(l, 35))
  } catch { return currentHex }
}

// ─── Default preset palettes ─────────────────────────────────────────────────

const DEFAULT_PRESETS = [
  // ── School / current theme
  { name: 'Classic Gold',    primary: '#C9A84C', navy: '#0A1628' },  // Oasis default
  // ── Common software colours
  { name: 'Windows Blue',    primary: '#0078D4', navy: '#071525' },  // Microsoft
  { name: 'GitHub Dark',     primary: '#58A6FF', navy: '#0D1117' },  // GitHub dark mode
  { name: 'Spotify',         primary: '#1DB954', navy: '#121212' },  // Spotify
  { name: 'Discord',         primary: '#5865F2', navy: '#23272A' },  // Discord blurple
  // ── Classic school / university colours
  { name: 'Oxford',          primary: '#B8860B', navy: '#002147' },  // Oxford gold on oxford blue
  { name: 'Harvard Crimson', primary: '#A51C30', navy: '#1A0508' },  // Harvard
  { name: 'Forest Green',    primary: '#27AE60', navy: '#0A1A0D' },  // Common school green
  { name: 'School Maroon',   primary: '#B91C1C', navy: '#1A0405' },  // Traditional maroon
  { name: 'Royal Purple',    primary: '#7B2D8B', navy: '#0F0520' },  // Common school purple
]

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({ label, desc, value, onChange }) {
  const [hex, setHex] = useState(value)
  const inputRef = useRef()

  useEffect(() => { setHex(value) }, [value])

  const handleHex = (v) => {
    setHex(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v)
  }

  const handleNative = (e) => {
    const v = e.target.value
    setHex(v)
    onChange(v)
  }

  const handleHue = (e) => {
    const newHex = hueToHex(Number(e.target.value), value)
    setHex(newHex)
    onChange(newHex)
  }

  const hue = hexToHue(value)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-montserrat mb-1">{label}</p>
      {desc && <p className="text-[10px] text-gray-600 font-montserrat mb-3">{desc}</p>}
      <div className="flex items-center gap-4">
        {/* Swatch — click to open native picker */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-20 h-20 rounded-2xl border-2 border-white/20 shadow-xl flex-shrink-0 overflow-hidden group transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
          title="Click to open colour picker"
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
            <MdPalette className="text-white opacity-0 group-hover:opacity-80 text-2xl transition-all drop-shadow" />
          </div>
        </button>
        <input ref={inputRef} type="color" value={value} onChange={handleNative} className="sr-only" />

        <div className="flex-1 space-y-2">
          {/* Hex input */}
          <div>
            <label className="text-[10px] text-gray-600 font-montserrat uppercase tracking-widest">Hex value</label>
            <input
              type="text"
              value={hex}
              maxLength={7}
              onChange={e => handleHex(e.target.value)}
              className="w-full mt-1 bg-[#060F1C] border border-white/10 focus:border-white/30 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none transition-all"
              placeholder="#000000"
            />
          </div>
          {/* Hue slider */}
          <div>
            <label className="text-[10px] text-gray-600 font-montserrat uppercase tracking-widest">
              Quick hue — {hue}°
            </label>
            <input
              type="range" min={0} max={359} step={1}
              value={hue}
              onChange={handleHue}
              className="w-full mt-1 h-3 rounded-full cursor-pointer appearance-none focus:outline-none"
              style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Live Preview — uses ONLY inline styles so it works before Tailwind rebuild ──

function LivePreview({ primary, navy }) {
  const navyLight  = lighten(navy, 8)
  const navy800    = lighten(navy, 4)
  const navyDark   = lighten(navy, 2)

  return (
    <div className="space-y-4">
      {/* Admin portal */}
      <p className="text-[10px] font-semibold uppercase tracking-widest font-montserrat" style={{ color: 'rgb(75 85 99)' }}>
        Admin Portal Preview
      </p>
      <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)', height: 270 }}>
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: navyDark, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary }}>
            <FaGraduationCap style={{ color: navy, fontSize: 11 }} />
          </div>
          <span className="text-white text-xs font-bold font-playfair flex-1">School Admin</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold font-montserrat" style={{ backgroundColor: alpha(primary, 0.15), color: primary, border: `1px solid ${alpha(primary, 0.3)}` }}>
            Premium S
          </span>
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Body */}
        <div className="flex" style={{ height: 'calc(100% - 40px)' }}>
          {/* Sidebar */}
          <div className="p-2 flex-shrink-0" style={{ width: 148, backgroundColor: navy, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Active item */}
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg text-[10px] font-semibold font-montserrat mb-0.5"
              style={{ backgroundColor: alpha(primary, 0.12), borderLeft: `2px solid ${primary}`, color: primary }}>
              Dashboard
            </div>
            {['Students', 'Website', 'Settings', 'License'].map(l => (
              <div key={l} className="flex items-center gap-2 px-2 py-2 text-[10px] font-montserrat" style={{ color: 'rgb(107 114 128)', paddingLeft: 10 }}>
                {l}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 space-y-3 overflow-hidden" style={{ backgroundColor: navy800 }}>
            {/* Buttons */}
            <div className="flex gap-2">
              <button className="text-[10px] font-bold font-montserrat px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: primary, color: navy }}>
                Primary Button
              </button>
              <button className="text-[10px] font-semibold font-montserrat px-3 py-1.5 rounded-lg"
                style={{ border: `1px solid ${alpha(primary, 0.45)}`, color: primary }}>
                Outline
              </button>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[9px] font-montserrat mb-1" style={{ color: 'rgb(107 114 128)' }}>
                <span>Student Enrolment</span>
                <span style={{ color: primary, fontWeight: 600 }}>65 / 150</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)', height: 6 }}>
                <div className="h-full rounded-full" style={{ backgroundColor: primary, width: '43%', transition: 'background-color 0.3s' }} />
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold font-montserrat"
                style={{ backgroundColor: alpha(primary, 0.15), color: primary, border: `1px solid ${alpha(primary, 0.3)}` }}>
                Active
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold font-montserrat"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgb(107 114 128)' }}>
                Inactive
              </span>
            </div>

            {/* Card */}
            <div className="rounded-lg p-2.5" style={{ border: `1px solid ${alpha(primary, 0.2)}`, backgroundColor: alpha(primary, 0.05) }}>
              <div className="text-[10px] font-semibold font-montserrat mb-1" style={{ color: primary }}>Feature Card</div>
              <div className="text-[9px] font-montserrat" style={{ color: 'rgb(107 114 128)' }}>Admin content with brand colour accents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Public website */}
      <p className="text-[10px] font-semibold uppercase tracking-widest font-montserrat mt-2" style={{ color: 'rgb(75 85 99)' }}>
        Website Preview
      </p>
      <div className="rounded-xl overflow-hidden shadow-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Navbar */}
        <div className="flex items-center gap-4 px-4 py-2.5" style={{ backgroundColor: navy }}>
          <span className="text-white text-sm font-bold font-playfair flex-1">Oasis Private College</span>
          {['About', 'Academics', 'Contact'].map(l => (
            <span key={l} className="text-[10px] font-montserrat hidden sm:block" style={{ color: 'rgb(156 163 175)' }}>{l}</span>
          ))}
          <button className="text-[10px] font-bold font-montserrat px-3 py-1.5 rounded"
            style={{ backgroundColor: primary, color: navy }}>
            Apply Now
          </button>
        </div>
        {/* Hero */}
        <div className="py-8 px-4 text-center" style={{ backgroundColor: navyDark }}>
          <div className="text-[9px] font-montserrat uppercase tracking-[0.2em] mb-2" style={{ color: primary }}>
            Welcome · Checheche, Zimbabwe
          </div>
          <div className="text-white text-xl font-playfair font-bold mb-1">
            Where <span style={{ color: primary }}>Excellence</span> Flows
          </div>
          <div className="text-[10px] font-montserrat mb-4 max-w-xs mx-auto" style={{ color: 'rgb(107 114 128)' }}>
            A premier day school shaping Zimbabwe's future leaders.
          </div>
          <button className="text-xs font-bold font-montserrat px-5 py-2 rounded shadow-lg"
            style={{ backgroundColor: primary, color: navy }}>
            Explore School
          </button>
        </div>
        {/* Stats strip */}
        <div className="flex justify-around px-4 py-3" style={{ backgroundColor: navyLight, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[['500+', 'Students'], ['95%', 'Pass Rate'], ['40+', 'Subjects'], ['12', 'Years']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-xs font-bold font-playfair" style={{ color: primary }}>{v}</div>
              <div className="text-[9px] font-montserrat" style={{ color: 'rgb(75 85 99)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Mini colour swatch picker (used inside preset edit cards) ───────────────

function MiniColorSwatch({ value, onChange, label }) {
  const ref = useRef()
  return (
    <div className="flex-1">
      <div className="text-[9px] text-gray-600 font-montserrat mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-7 h-7 rounded-md flex-shrink-0 border border-white/20 hover:scale-110 transition-transform"
          style={{ backgroundColor: value }}
        />
        <input ref={ref} type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
        <input
          value={value}
          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          className="flex-1 bg-black/30 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white font-mono focus:outline-none focus:border-white/30 min-w-0"
          maxLength={7}
        />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function findPresetName(presets, p, n) {
  return presets.find(pr =>
    pr.primary.toLowerCase() === p.toLowerCase() &&
    pr.navy.toLowerCase() === n.toLowerCase()
  )?.name ?? null
}

export default function ThemeCustomizer() {
  const { primaryColor, navyColor, loaded, applyTheme, saveTheme } = useBrand()
  const [primary, setPrimary] = useState(primaryColor)
  const [navy,    setNavy]    = useState(navyColor)
  const [saving,  setSaving]  = useState(false)
  const [activePreset, setActivePreset] = useState(null)
  const syncedRef = useRef(false)

  // Preset management state
  const [presets,       setPresets]       = useState(DEFAULT_PRESETS)
  const [editingIdx,    setEditingIdx]    = useState(null)
  const [editDraft,     setEditDraft]     = useState(null)
  const [savingPresets, setSavingPresets] = useState(false)
  const [applyingIdx,   setApplyingIdx]   = useState(null)

  // Load custom presets from Firestore on mount
  useEffect(() => {
    getPresets().then(saved => { if (saved?.length) setPresets(saved) })
  }, [])

  // One-time sync from Firestore once theme has loaded
  useEffect(() => {
    if (loaded && !syncedRef.current) {
      syncedRef.current = true
      setPrimary(primaryColor)
      setNavy(navyColor)
      setActivePreset(findPresetName(presets, primaryColor, navyColor))
    }
  }, [loaded, primaryColor, navyColor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply CSS variables whenever local colour state changes (no context state update = no loop)
  useEffect(() => {
    applyTheme(primary, navy)
  }, [primary, navy]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Colour pickers
  const changePrimary = (v) => { setPrimary(v); setActivePreset(findPresetName(presets, v, navy)) }
  const changeNavy    = (v) => { setNavy(v);    setActivePreset(findPresetName(presets, primary, v)) }

  // ── Apply preset: immediately saves & propagates to whole system
  const handlePreset = async (p, idx) => {
    if (applyingIdx !== null) return
    setApplyingIdx(idx)
    setPrimary(p.primary)
    setNavy(p.navy)
    setActivePreset(p.name)
    try {
      await saveTheme(p.primary, p.navy)
      toast.success(`"${p.name}" applied to the whole system`)
    } catch {
      toast.error('Failed to apply preset')
    } finally {
      setApplyingIdx(null)
    }
  }

  // ── Preset editing
  const startEdit = (e, idx) => {
    e.stopPropagation()
    setEditingIdx(idx)
    setEditDraft({ ...presets[idx] })
  }

  const saveEdit = async () => {
    if (!editDraft?.name.trim() || !/^#[0-9A-Fa-f]{6}$/.test(editDraft.primary) || !/^#[0-9A-Fa-f]{6}$/.test(editDraft.navy)) {
      return toast.error('Fill in all fields with valid hex colours')
    }
    setSavingPresets(true)
    try {
      const updated = presets.map((p, i) => i === editingIdx ? { ...editDraft } : p)
      await savePresets(updated)
      setPresets(updated)
      if (activePreset === presets[editingIdx]?.name) setActivePreset(editDraft.name)
      setEditingIdx(null)
      toast.success('Preset saved')
    } catch {
      toast.error('Failed to save preset')
    } finally {
      setSavingPresets(false)
    }
  }

  const cancelEdit = () => { setEditingIdx(null); setEditDraft(null) }

  const deletePreset = async (idx) => {
    if (presets.length <= 1) return toast.error('Must keep at least one preset')
    setSavingPresets(true)
    try {
      const updated = presets.filter((_, i) => i !== idx)
      await savePresets(updated)
      setPresets(updated)
      setEditingIdx(null)
      toast.success('Preset deleted')
    } catch {
      toast.error('Failed to delete preset')
    } finally {
      setSavingPresets(false)
    }
  }

  const addPreset = async () => {
    const newPreset = { name: 'New Theme', primary, navy }
    const updated = [...presets, newPreset]
    setSavingPresets(true)
    try {
      await savePresets(updated)
      setPresets(updated)
      setEditingIdx(updated.length - 1)
      setEditDraft({ ...newPreset })
    } catch {
      toast.error('Failed to add preset')
    } finally {
      setSavingPresets(false)
    }
  }

  const resetPresetsToDefaults = async () => {
    setSavingPresets(true)
    try {
      await savePresets(DEFAULT_PRESETS)
      setPresets(DEFAULT_PRESETS)
      toast.success('Presets reset to defaults')
    } catch {
      toast.error('Failed to reset presets')
    } finally {
      setSavingPresets(false)
    }
  }

  // ── Custom colour save (manual)
  const handleReset = () => {
    setPrimary(DEFAULT_PRIMARY)
    setNavy(DEFAULT_NAVY)
    setActivePreset(findPresetName(presets, DEFAULT_PRIMARY, DEFAULT_NAVY))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveTheme(primary, navy)
      toast.success('Theme saved — live across the entire system')
    } catch {
      toast.error('Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-montserrat"
        style={{ backgroundColor: alpha(primary, 0.1), border: `1px solid ${alpha(primary, 0.3)}`, color: primary }}>
        <MdPalette className="text-lg flex-shrink-0 mt-0.5" />
        <span>
          Click any preset to <strong>instantly apply it system-wide</strong>. Use the pickers below to build a custom colour, then hit <strong>Save Theme</strong>.
          Hover a preset card to <strong>edit or delete</strong> it.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Controls ── */}
        <div className="space-y-6">

          {/* Preset grid */}
          <div className="bg-navy-800 rounded-xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-montserrat">Preset Themes</p>
              <button
                onClick={resetPresetsToDefaults}
                disabled={savingPresets}
                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 font-montserrat transition disabled:opacity-40"
                title="Reset all presets to built-in defaults"
              >
                <MdRestorePage size={12} /> Reset defaults
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {presets.map((p, idx) => {
                const isActive   = activePreset === p.name
                const isEditing  = editingIdx === idx
                const isApplying = applyingIdx === idx

                if (isEditing && editDraft) {
                  return (
                    <div key={idx} className="col-span-1 p-3 rounded-xl border"
                      style={{ borderColor: alpha(editDraft.primary, 0.5), backgroundColor: alpha(editDraft.primary, 0.06) }}>
                      {/* Name */}
                      <input
                        value={editDraft.name}
                        onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white font-montserrat font-semibold mb-2 focus:outline-none focus:border-white/30"
                        placeholder="Preset name"
                        autoFocus
                      />
                      {/* Colour rows */}
                      <div className="flex gap-2 mb-3">
                        <MiniColorSwatch
                          label="Accent"
                          value={editDraft.primary}
                          onChange={v => setEditDraft(d => ({ ...d, primary: v }))}
                        />
                        <MiniColorSwatch
                          label="Background"
                          value={editDraft.navy}
                          onChange={v => setEditDraft(d => ({ ...d, navy: v }))}
                        />
                      </div>
                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={saveEdit}
                          disabled={savingPresets}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold font-montserrat transition disabled:opacity-50"
                          style={{ backgroundColor: editDraft.primary, color: editDraft.navy }}
                        >
                          {savingPresets ? '…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold font-montserrat border border-white/15 text-gray-400 hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deletePreset(idx)}
                          disabled={presets.length <= 1 || savingPresets}
                          className="px-2 py-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition disabled:opacity-30"
                          title="Delete preset"
                        >
                          <MdDelete size={13} />
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => handlePreset(p, idx)}
                      disabled={isApplying || applyingIdx !== null}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left disabled:cursor-wait"
                      style={{
                        borderColor: isActive ? primary : 'rgba(255,255,255,0.1)',
                        backgroundColor: isActive ? alpha(primary, 0.08) : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      {/* Two-tone swatch */}
                      <div className="flex-shrink-0 flex rounded-lg overflow-hidden w-10 h-10"
                        style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                        <div className="flex-1" style={{ backgroundColor: p.navy }} />
                        <div className="flex-1" style={{ backgroundColor: p.primary }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-gray-200 font-montserrat truncate">{p.name}</div>
                        <div className="text-[9px] text-gray-600 font-montserrat font-mono">{p.primary}</div>
                      </div>
                      {isApplying ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                          style={{ borderColor: p.primary }} />
                      ) : isActive ? (
                        <FaCheckCircle className="flex-shrink-0 text-xs" style={{ color: primary }} />
                      ) : null}
                    </button>
                    {/* Edit pencil — hover only */}
                    <button
                      onClick={e => startEdit(e, idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-md border border-white/10 bg-navy flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-white/25"
                      title="Edit preset"
                    >
                      <MdEdit size={11} className="text-gray-400" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Add preset row */}
            <button
              onClick={addPreset}
              disabled={savingPresets}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-white/15 text-gray-600 hover:border-white/30 hover:text-gray-400 text-xs font-montserrat transition disabled:opacity-40"
            >
              <MdAdd size={14} />
              Save current colours as new preset
            </button>
          </div>

          {/* Custom colour pickers */}
          <div className="bg-navy-800 rounded-xl border border-white/10 p-5 space-y-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-montserrat">Custom Colours</p>
            <ColorPicker
              label="Brand / Accent Colour"
              desc="Buttons, highlights, active links, badges, progress bars"
              value={primary}
              onChange={changePrimary}
            />
            <div className="border-t border-white/10" />
            <ColorPicker
              label="Dark Background"
              desc="Admin portals, sidebars, navbars, dark overlays"
              value={navy}
              onChange={changeNavy}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-gray-400 hover:text-white hover:border-white/30 text-sm font-semibold font-montserrat transition-all"
            >
              <MdRefresh size={16} />
              Reset Colours
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm font-montserrat px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: primary, color: navy }}
            >
              <MdSave size={16} />
              {saving ? 'Saving…' : 'Save Theme'}
            </button>
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="bg-navy-800 rounded-xl border border-white/10 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-montserrat mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ backgroundColor: '#4ade80' }} />
            Live Preview
          </p>
          <LivePreview primary={primary} navy={navy} />
        </div>
      </div>
    </div>
  )
}
