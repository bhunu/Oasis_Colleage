// Central school identity — all values come from .env so no code changes are
// needed when deploying for a new school. Just update the .env file and rebuild.
const sc = {
  name:      import.meta.env.VITE_SCHOOL_NAME       || 'School Name',
  shortName: import.meta.env.VITE_SCHOOL_SHORT_NAME || import.meta.env.VITE_SCHOOL_NAME || 'School',
  address:   import.meta.env.VITE_SCHOOL_ADDRESS    || '',
  tagline:   import.meta.env.VITE_SCHOOL_TAGLINE    || '',
  email:     import.meta.env.VITE_SCHOOL_EMAIL      || '',
  phone:     import.meta.env.VITE_SCHOOL_PHONE      || '',
}

export default sc

// Backwards-compat named export (used as a database namespace, not a display name)
export const SCHOOL_ID = 'oasis'
