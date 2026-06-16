import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const svg = readFileSync(resolve(root, 'public/favicon.svg'))

const icons = [
  { name: 'pwa-192.png',          size: 192 },
  { name: 'pwa-512.png',          size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-maskable-512.png', size: 512 },
]

for (const { name, size } of icons) {
  await sharp(svg, { density: Math.ceil((size / 64) * 72) })
    .resize(size, size)
    .png()
    .toFile(resolve(root, 'public', name))
  console.log(`✓ public/${name}`)
}

console.log('Done.')
