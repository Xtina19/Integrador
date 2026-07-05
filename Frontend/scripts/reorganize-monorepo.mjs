/**
 * Reorganize LibroSys into Frontend/ and Backend/
 * Run from repo root: node scripts/reorganize-monorepo.mjs
 */
import fs from 'fs'
import path from 'path'

const root = process.cwd()

function exists(p) {
  return fs.existsSync(p)
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function moveItem(from, to) {
  if (!exists(from)) return false
  ensureDir(path.dirname(to))
  if (exists(to)) {
    fs.rmSync(to, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
  }
  fs.renameSync(from, to)
  return true
}

function rmDir(p) {
  if (exists(p)) fs.rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
}

console.log('Root:', root)

// --- Backend: backend/backend -> Backend ---
const innerBackend = path.join(root, 'backend', 'backend')
const backendStaging = path.join(root, '_backend_staging')
const backendTarget = path.join(root, 'Backend')

if (exists(innerBackend)) {
  rmDir(backendStaging)
  moveItem(innerBackend, backendStaging)
  rmDir(path.join(root, 'backend'))
  rmDir(backendTarget)
  moveItem(backendStaging, backendTarget)
  console.log('Backend -> Backend/')
} else if (exists(backendTarget)) {
  console.log('Backend/ already exists')
}

// --- Frontend ---
const frontendTarget = path.join(root, 'Frontend')
ensureDir(frontendTarget)

const frontendItems = [
  'src', 'public', 'node_modules', 'dist', 'scripts',
  'index.html', 'package.json', 'package-lock.json',
  'vite.config.ts', 'tsconfig.json', 'tsconfig.node.json',
  'tsconfig.tsbuildinfo', 'postcss.config.js', 'tailwind.config.js',
  '.env.example', '.env',
]

for (const item of frontendItems) {
  const from = path.join(root, item)
  const to = path.join(frontendTarget, item)
  if (moveItem(from, to)) console.log(`Moved ${item} -> Frontend/`)
}

console.log('Done.')
