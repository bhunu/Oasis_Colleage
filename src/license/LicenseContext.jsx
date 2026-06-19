import { createContext, useContext, useEffect, useState } from 'react'
import { verifyLicense } from './licenseUtils'
import { getStoredLicense } from '../firebase/licenseConfig'

// status values: 'loading' | 'valid' | 'expired' | 'suspended' | 'invalid' | 'none'
const LicenseContext = createContext(null)

export function LicenseProvider({ children }) {
  const [status,      setStatus]      = useState('loading')
  const [licenseData, setLicenseData] = useState(null)

  useEffect(() => {
    const isDev = import.meta.env.VITE_IS_DEVELOPER_INSTANCE === 'true'

    // Developer's own instance — always valid, super admin panel enabled
    if (isDev) {
      setLicenseData({
        schoolName: import.meta.env.VITE_SCHOOL_NAME || 'School',
        plan:       'developer',
        iss:        'OasisSystems',
        isDeveloper: true,
      })
      setStatus('valid')
      return
    }

    async function init() {
      let token  = null
      let secret = null

      // Check Firestore first — allows updating license without rebuilding
      try {
        const stored = await getStoredLicense()
        if (stored?.token && stored?.secret) {
          token  = stored.token
          secret = stored.secret
        }
      } catch { /* Firestore unavailable — fall through to env vars */ }

      // Fall back to env vars
      if (!token)  token  = import.meta.env.VITE_LICENSE_TOKEN
      if (!secret) secret = import.meta.env.VITE_LICENSE_SECRET

      if (!token || !secret || token === 'PASTE_YOUR_GENERATED_TOKEN_HERE') {
        setStatus('none')
        return
      }

      verifyLicense(token, secret)
        .then(data => {
          setLicenseData(data)
          setStatus('valid')
        })
        .catch(err => {
          if (err.code === 'EXPIRED')        { setLicenseData(err.data); setStatus('expired')   }
          else if (err.code === 'SUSPENDED') { setLicenseData(err.data); setStatus('suspended') }
          else                               { setStatus('invalid') }
        })
    }

    init()
  }, [])

  // Developer instance has all features unlocked
  const hasFeature = (key) => {
    if (!key) return true
    const data = licenseData
    if (!data) return false
    if (data.isDeveloper) return true
    if (!Array.isArray(data.features)) return false
    return data.features.includes(key)
  }

  return (
    <LicenseContext.Provider value={{ status, licenseData, hasFeature }}>
      {children}
    </LicenseContext.Provider>
  )
}

export const useLicense = () => useContext(LicenseContext)
