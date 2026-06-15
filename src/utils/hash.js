import md5 from 'js-md5'

async function sha256hex(password) {
  const data = new TextEncoder().encode(password)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password) {
  return sha256hex(password)
}

// Only used for transparent migration of legacy MD5 hashes on login.
// Remove once all student passwords have been re-hashed.
export function hashPasswordLegacy(password) {
  return md5(password)
}
