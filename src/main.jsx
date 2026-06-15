import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
