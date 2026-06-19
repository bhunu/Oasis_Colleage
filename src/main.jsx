import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { BrandProvider } from './context/BrandContext'
import { LicenseProvider } from './license/LicenseContext'
import LicenseGate from './license/LicenseGate'
import './index.css'

// Suppress raw Firestore/Firebase internals from browser DevTools in production.
// Dev keeps full console.error for debugging.
if (import.meta.env.PROD) {
  const _origError = console.error
  console.error = (msg, ...rest) => {
    if (typeof msg === 'string') _origError('[App]', msg)
    else _origError('[App Error]')
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandProvider>
    <ThemeProvider>
      <LicenseProvider>
        <BrowserRouter>
          <LicenseGate>
            <App />
          </LicenseGate>
        </BrowserRouter>
      </LicenseProvider>
    </ThemeProvider>
    </BrandProvider>
  </React.StrictMode>,
)
