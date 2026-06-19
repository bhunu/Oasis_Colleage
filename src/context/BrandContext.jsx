import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getThemeConfig, saveThemeConfig } from '../firebase/themeConfig'

export const DEFAULT_PRIMARY = '#C9A84C'
export const DEFAULT_NAVY    = '#0A1628'

const BrandContext = createContext(null)

function hexToRgb(hex) {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return [r, g, b]
}

function mix(c, target, ratio) {
  return c.map((v, i) => Math.min(255, Math.max(0, Math.round(v * (1 - ratio) + target[i] * ratio))))
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

function applyPrimaryVars(hex) {
  const [r, g, b] = hexToRgb(hex)
  const W = [255, 255, 255], K = [0, 0, 0]
  const root = document.documentElement
  const set = (k, rgb) => root.style.setProperty(k, rgb.join(' '))
  set('--color-primary',       [r, g, b])
  set('--color-primary-light', mix([r, g, b], W, 0.15))
  set('--color-primary-dark',  mix([r, g, b], K, 0.15))
  set('--color-primary-50',    mix([r, g, b], W, 0.88))
  set('--color-primary-100',   mix([r, g, b], W, 0.78))
  root.style.setProperty('--color-primary-hex', hex)
}

function applyNavyVars(hex) {
  const [r, g, b] = hexToRgb(hex)
  const W = [255, 255, 255], K = [0, 0, 0]
  const root = document.documentElement
  const set = (k, rgb) => root.style.setProperty(k, rgb.join(' '))
  const light = mix([r, g, b], W, 0.10)
  const dark  = mix([r, g, b], K, 0.10)
  const n800  = mix([r, g, b], W, 0.05)
  set('--color-navy',       [r, g, b])
  set('--color-navy-light', light)
  set('--color-navy-dark',  dark)
  set('--color-navy-800',   n800)
  root.style.setProperty('--color-navy-hex',       hex)
  root.style.setProperty('--color-navy-light-hex', rgbToHex(...light))
  root.style.setProperty('--color-navy-800-hex',   rgbToHex(...n800))
}

export function BrandProvider({ children }) {
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY)
  const [navyColor,    setNavyColor]    = useState(DEFAULT_NAVY)
  const [loaded,       setLoaded]       = useState(false)

  useEffect(() => {
    getThemeConfig().then(cfg => {
      const p = cfg?.primaryColor || DEFAULT_PRIMARY
      const n = cfg?.navyColor    || DEFAULT_NAVY
      setPrimaryColor(p)
      setNavyColor(n)
      applyPrimaryVars(p)
      applyNavyVars(n)
    }).finally(() => setLoaded(true))
  }, [])

  // Only updates CSS variables — does NOT touch context state to avoid re-render loops
  const applyTheme = useCallback((primary, navy) => {
    applyPrimaryVars(primary)
    applyNavyVars(navy)
  }, [])

  const saveTheme = useCallback(async (primary, navy) => {
    await saveThemeConfig({ primaryColor: primary, navyColor: navy })
    setPrimaryColor(primary)
    setNavyColor(navy)
    applyPrimaryVars(primary)
    applyNavyVars(navy)
  }, [])

  return (
    <BrandContext.Provider value={{ primaryColor, navyColor, loaded, applyTheme, saveTheme }}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => useContext(BrandContext)
