import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LETTERS = 'OASIS'.split('')

export default function Preloader({ onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 500)
    }, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-navy"
        >
          {/* Oasis illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.65, ease: 'easeOut' }}
            className="mb-1"
          >
            <OasisIllustration />
          </motion.div>

          {/* Letter-by-letter title */}
          <div className="flex gap-1 sm:gap-2 mb-2">
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.1, duration: 0.32, ease: 'easeOut' }}
                className="font-playfair text-4xl sm:text-6xl font-bold text-gold tracking-widest"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="font-montserrat text-xs sm:text-sm uppercase tracking-[0.35em] text-gold-light mb-8"
          >
            Private College
          </motion.p>

          {/* Gold progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 2.0, ease: 'easeInOut' }}
            style={{ originX: 0 }}
            className="w-32 sm:w-48 h-[3px] bg-gold rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Inline SVG: palm tree oasis scene ─────────────────────────────────── */
/*
 * Coordinate system: viewBox 0 0 220 200
 * Trunk path ends at crown (112, 57).
 * All fronds are ellipses placed in a <g transform="translate(112,57)">
 * so the SMIL animateTransform rotation is around (0,0) of that local
 * coordinate system = the crown of the trunk = natural sway pivot.
 *
 * Frond centers are pre-shifted by (-112, -57) from their absolute positions.
 * Rotation angles (deg) match atan2(dy, dx) for each frond direction.
 *
 * Frond | tip (abs)  | center (local) | θ     | rx   | ry
 *  1    | (109,10)   | (-1.5, -23.5)  | -94°  | 23.5 | 4.5
 *  2    | (157,20)   | (22.5, -18.5)  | -39°  | 29   | 4.5
 *  3    | (178,52)   | (33,   -2.5)   | -4°   | 33   | 3.5
 *  4    | (163,83)   | (25.5,  13)    |  27°  | 29   | 4
 *  5    | (72, 18)   | (-20,  -19.5)  | -136° | 28   | 4.5
 *  6    | (46, 54)   | (-33,   -1.5)  | 183°  | 33   | 3.5
 *  7    | (56, 84)   | (-28,   13.5)  | 154°  | 31   | 4
 *
 * Crescent: outer circle r=11 center=(170,25), inner r=9 center=(165,25)
 * Intersection x=163.5, y=16.1 / 33.9 → two-arc crescent path.
 */
function OasisIllustration() {
  return (
    <svg viewBox="0 0 220 200" width="200" height="182" aria-hidden="true">

      {/* ── Stars ── */}
      <circle cx="20"  cy="22" r="1.5" fill="#F7EDCC" opacity="0.9"/>
      <circle cx="185" cy="14" r="1.2" fill="#F7EDCC" opacity="0.7"/>
      <circle cx="55"  cy="10" r="1"   fill="#F7EDCC" opacity="0.8"/>
      <circle cx="172" cy="38" r="1.2" fill="#F7EDCC" opacity="0.6"/>
      <circle cx="18"  cy="52" r="0.8" fill="#F7EDCC" opacity="0.7"/>
      <circle cx="195" cy="58" r="1"   fill="#F7EDCC" opacity="0.8"/>
      <circle cx="38"  cy="42" r="0.8" fill="#F7EDCC" opacity="0.6"/>

      {/* ── Crescent moon ── */}
      <path
        d="M 163.5,16.1 A 11,11 0 1,1 163.5,33.9 A 9,9 0 0,0 163.5,16.1 Z"
        fill="#D4B96A"
      />

      {/* ── Back sand dune ── */}
      <path
        d="M 0,183 C 35,167 78,160 115,163 C 152,166 188,173 220,169 L 220,200 L 0,200 Z"
        fill="#8B6914" opacity="0.8"
      />

      {/* ── Oasis pool ── */}
      <ellipse cx="108" cy="179"   rx="32" ry="10"  style={{ fill: 'var(--color-navy-hex)' }}/>
      <ellipse cx="108" cy="178.5" rx="26" ry="7.5" style={{ fill: 'var(--color-navy-light-hex)' }}/>
      <path d="M 90,177.5 Q 108,174 126,177.5"   style={{ stroke: 'var(--color-primary-hex)' }} strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M 95,181   Q 108,179 121,181"      stroke="#5B8FA8" strokeWidth="0.7" fill="none" opacity="0.35"/>

      {/* ── Front sand dune ── */}
      <path
        d="M 0,190 C 38,177 82,170 118,173 C 148,176 188,183 220,178 L 220,200 L 0,200 Z"
        style={{ fill: 'var(--color-primary-hex)' }}
      />

      {/* ── Trunk shadow on sand ── */}
      <ellipse cx="110" cy="182" rx="10" ry="3.5" fill="#060F1C" opacity="0.35"/>

      {/* ── Palm trunk (three-stroke layered for depth) ── */}
      <path d="M 105,178 C 103,158 106,130 110,108 C 112,90 114,74 112,57"
        stroke="#5A3800" strokeWidth="9"   fill="none" strokeLinecap="round"/>
      <path d="M 105,178 C 103,158 106,130 110,108 C 112,90 114,74 112,57"
        stroke="#9B6500" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
      <path d="M 105,178 C 103,158 106,130 110,108 C 112,90 114,74 112,57"
        stroke="#C08A00" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35"/>

      {/* ── Crown: fronds + coconuts, pivoted at trunk top (112,57) ── */}
      <g transform="translate(112,57)">
        {/* Gentle breeze sway via SMIL — no JS or CSS required */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          additive="sum"
          values="-2,0,0; 2,0,0; -2,0,0"
          dur="3.5s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
        />

        {/* Frond 1 – straight up */}
        <ellipse cx="-1.5" cy="-23.5" rx="23.5" ry="4.5" transform="rotate(-94,-1.5,-23.5)"  fill="#236823"/>
        {/* Frond 5 – upper-left */}
        <ellipse cx="-20"  cy="-19.5" rx="28"   ry="4.5" transform="rotate(-136,-20,-19.5)"  fill="#2D8A2D"/>
        {/* Frond 2 – upper-right */}
        <ellipse cx="22.5" cy="-18.5" rx="29"   ry="4.5" transform="rotate(-39,22.5,-18.5)"  fill="#2D8A2D"/>
        {/* Frond 6 – left */}
        <ellipse cx="-33"  cy="-1.5"  rx="33"   ry="3.5" transform="rotate(183,-33,-1.5)"    fill="#268526"/>
        {/* Frond 3 – right */}
        <ellipse cx="33"   cy="-2.5"  rx="33"   ry="3.5" transform="rotate(-4,33,-2.5)"      fill="#268526"/>
        {/* Frond 7 – lower-left (drooping) */}
        <ellipse cx="-28"  cy="13.5"  rx="31"   ry="4"   transform="rotate(154,-28,13.5)"    fill="#1E6A1E"/>
        {/* Frond 4 – lower-right (drooping) */}
        <ellipse cx="25.5" cy="13"    rx="29"   ry="4"   transform="rotate(27,25.5,13)"      fill="#1E6A1E"/>

        {/* Coconuts at crown base */}
        <circle cx="4"  cy="4"   r="4.5" fill="#6B3A10"/>
        <circle cx="-3" cy="6"   r="4.5" fill="#7D4512"/>
        <circle cx="0"  cy="1.5" r="4"   fill="#5A3010"/>
      </g>
    </svg>
  )
}
