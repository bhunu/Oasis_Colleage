// JWT HS256 sign/verify using the browser's Web Crypto API — no external library needed.

function bytesToBase64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlToBytes(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4)
  return Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad), c => c.charCodeAt(0))
}

function encodeSection(obj) {
  return bytesToBase64url(new TextEncoder().encode(JSON.stringify(obj)))
}

function decodeSection(str) {
  return JSON.parse(new TextDecoder().decode(base64urlToBytes(str)))
}

async function importKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage,
  )
}

export async function signLicense(payload, secret) {
  const header = encodeSection({ alg: 'HS256', typ: 'JWT' })
  const body   = encodeSection(payload)
  const input  = `${header}.${body}`
  const key    = await importKey(secret, ['sign'])
  const sig    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  return `${input}.${bytesToBase64url(sig)}`
}

// Returns decoded payload on success.
// Throws errors with .code property: INVALID_FORMAT | INVALID_SIGNATURE | INVALID_PAYLOAD | EXPIRED | SUSPENDED
export async function verifyLicense(token, secret) {
  if (!token || !secret) { const e = new Error('Missing token or secret'); e.code = 'INVALID_FORMAT'; throw e }

  const parts = token.split('.')
  if (parts.length !== 3) { const e = new Error('Bad JWT structure'); e.code = 'INVALID_FORMAT'; throw e }

  const [headerB64, payloadB64, sigB64] = parts
  const key   = await importKey(secret, ['verify'])
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    base64urlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  )
  if (!valid) { const e = new Error('Signature mismatch'); e.code = 'INVALID_SIGNATURE'; throw e }

  let data
  try { data = decodeSection(payloadB64) }
  catch { const e = new Error('Payload decode failed'); e.code = 'INVALID_PAYLOAD'; throw e }

  const now = Math.floor(Date.now() / 1000)
  if (data.exp && data.exp < now) {
    const e = new Error('License expired'); e.code = 'EXPIRED'; e.data = data; throw e
  }
  if (data.suspended) {
    const e = new Error('License suspended'); e.code = 'SUSPENDED'; e.data = data; throw e
  }

  return data
}

export function daysUntilExpiry(exp) {
  if (!exp) return null
  return Math.ceil((exp - Math.floor(Date.now() / 1000)) / 86400)
}

export function formatExpiry(exp) {
  if (!exp) return 'No expiry set'
  return new Date(exp * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function expiryFromYears(years) {
  return Math.floor(Date.now() / 1000) + years * 365 * 86400
}

export function expiryFromDate(dateString) {
  return Math.floor(new Date(dateString).getTime() / 1000)
}
