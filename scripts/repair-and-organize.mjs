/**
 * Repairs malformed module paths from failed reorganization and completes safe structure.
 * Run: node scripts/repair-and-organize.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, files)
    else if (/\.(tsx?|css)$/.test(e.name)) files.push(full)
  }
  return files
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function moveFile(from, to) {
  if (!fs.existsSync(from)) return false
  ensureDir(path.dirname(to))
  if (fs.existsSync(to)) fs.unlinkSync(to)
  fs.renameSync(from, to)
  return true
}

function writeShim(shimPath, exportPath) {
  ensureDir(path.dirname(shimPath))
  const ext = path.extname(shimPath)
  if (ext === '.css') return // never shim css
  fs.writeFileSync(shimPath, `export * from '${exportPath}'\n`, 'utf8')
}

function isShim(content) {
  return /^export \* from ['"].+['"]\s*$/m.test(content.trim()) && content.split('\n').filter(Boolean).length <= 2
}

// --- Phase 1: Fix malformed nested paths under modules/ ---
const moduleFiles = walk(path.join(SRC, 'modules'))
for (const file of moduleFiles) {
  const norm = file.replace(/\\/g, '/')
  const pagesMarker = '/src/pages/'
  const compMarker = '/src/components/'
  let marker = -1
  let kind = ''
  if (norm.includes(pagesMarker)) {
    marker = norm.indexOf(pagesMarker)
    kind = 'pages'
  } else if (norm.includes(compMarker)) {
    marker = norm.indexOf(compMarker)
    kind = 'components'
  }
  if (marker < 0) continue

  const relAfter = norm.slice(marker + (kind === 'pages' ? pagesMarker.length : compMarker.length))
  const parts = relAfter.split('/')
  const moduleMap = {
    ventas: 'ventas',
    compras: 'compras',
    importaciones: 'importaciones',
    editoriales: 'editoriales',
    eventos: 'eventos',
    usuarios: 'usuarios',
    reportes: 'reportes',
    auditoria: 'auditoria',
    configuracion: 'configuracion',
    ayuda: 'ayuda',
    admin: 'admin',
    inventario: 'inventario',
  }

  let targetModule = parts[0] in moduleMap ? parts[0] : null
  let subPath = parts.slice(1).join('/')

  // Root-level pages (Dashboard, Events, etc.) already at modules/X/pages/Filename
  if (!targetModule) {
    const base = path.basename(relAfter)
    if (base === 'Dashboard.tsx') targetModule = 'dashboard'
    else if (base === 'Inventory.tsx') targetModule = 'inventario'
    else if (base === 'Transfers.tsx') targetModule = 'transferencias'
    else if (base === 'Events.tsx') targetModule = 'eventos'
    else if (base === 'Users.tsx') targetModule = 'usuarios'
    subPath = base
  }

  if (!targetModule) continue

  const target = path.join(SRC, 'modules', targetModule, kind, subPath)
  if (path.resolve(file) === path.resolve(target)) continue
  moveFile(file, target)
  console.log('FIXED', path.relative(SRC, file), '->', path.relative(SRC, target))
}

// --- Phase 2: data shims -> mocks ---
const mockShims = {
  'data/mockData.ts': '@/mocks/mockCore',
  'data/adminMockData.ts': '@/mocks/mockAdmin',
  'data/salesMockData.ts': '@/mocks/mockVentas',
  'data/eventsMockData.ts': '@/mocks/mockEventos',
  'data/importsMockData.ts': '@/mocks/mockImportaciones',
  'data/purchasesMockData.ts': '@/mocks/mockCompras',
  'data/inventoryMockData.ts': '@/mocks/mockInventario',
  'data/staffAssignmentData.ts': '@/mocks/mockStaff',
  'data/usersMockData.ts': '@/mocks/mockUsuarios',
  'data/auditMockData.ts': '@/mocks/mockAuditoria',
  'data/configMockData.ts': '@/mocks/mockConfiguracion',
  'data/helpMockData.ts': '@/mocks/mockAyuda',
}

for (const [shim, exp] of Object.entries(mockShims)) {
  writeShim(path.join(SRC, shim), exp)
}

// --- Phase 3: lib/types shims ---
const libShims = {
  'lib/eventBudget.ts': '@/modules/eventos/utils/eventBudget',
  'lib/eventFieldLock.ts': '@/modules/eventos/utils/eventFieldLock',
  'lib/salesExchange.ts': '@/modules/ventas/utils/salesExchange',
  'lib/useTableExport.ts': '@/hooks/useTableExport',
  'types/eventExtended.ts': '@/modules/eventos/types/eventExtended',
  'types/salesExchange.ts': '@/modules/ventas/types/salesExchange',
  'business-rules/stateMachines.ts': '@/constants/stateMachines',
}

for (const [shim, exp] of Object.entries(libShims)) {
  writeShim(path.join(SRC, shim), exp)
}

// --- Phase 4: ui component shims ---
const uiShims = {
  'components/ui/Card.tsx': '@/components/cards/Card',
  'components/ui/Table.tsx': '@/components/tables/Table',
  'components/ui/TableActions.tsx': '@/components/tables/TableActions',
  'components/ui/FormDialog.tsx': '@/components/dialogs/FormDialog',
  'components/ui/ConfirmDialog.tsx': '@/components/dialogs/ConfirmDialog',
}

for (const [shim, exp] of Object.entries(uiShims)) {
  writeShim(path.join(SRC, shim), exp)
}

// --- Phase 5: page/component shims pointing to modules ---
function createModuleShim(oldRel, moduleName, kind, subPath) {
  writeShim(path.join(SRC, oldRel), `@/modules/${moduleName}/${kind}/${subPath.replace(/\.tsx?$/, '')}`)
}

const pageShimRoots = [
  ['pages/Dashboard.tsx', 'dashboard', 'pages', 'Dashboard.tsx'],
  ['pages/Inventory.tsx', 'inventario', 'pages', 'Inventory.tsx'],
  ['pages/Transfers.tsx', 'transferencias', 'pages', 'Transfers.tsx'],
  ['pages/Events.tsx', 'eventos', 'pages', 'Events.tsx'],
  ['pages/Users.tsx', 'usuarios', 'pages', 'Users.tsx'],
]

for (const [old, mod, kind, sub] of pageShimRoots) {
  createModuleShim(old, mod, kind, sub)
}

// Walk modules pages/components and create shims at old paths
for (const kind of ['pages', 'components']) {
  const modulesDir = path.join(SRC, 'modules')
  if (!fs.existsSync(modulesDir)) continue
  for (const mod of fs.readdirSync(modulesDir)) {
    const kindDir = path.join(modulesDir, mod, kind)
    if (!fs.existsSync(kindDir)) continue
    for (const file of walk(kindDir)) {
      const rel = path.relative(kindDir, file).replace(/\\/g, '/')
      const oldPath =
        kind === 'pages'
          ? mod === 'dashboard' || mod === 'transferencias'
            ? null
            : `pages/${mod === 'inventario' && rel === 'Inventory.tsx' ? '' : mod + '/'}${rel}`.replace(/\/+/g, '/')
          : `components/${mod}/${rel}`

      if (!oldPath) continue
      const target = `@/modules/${mod}/${kind}/${rel.replace(/\.tsx?$/, '')}`
      writeShim(path.join(SRC, oldPath), target)
    }
  }
}

// Layout shims
const layoutShims = {
  'pages/ventas/VentasLayout.tsx': '@/layouts/VentasLayout',
  'pages/compras/ComprasLayout.tsx': '@/layouts/ComprasLayout',
  'pages/importaciones/ImportacionesLayout.tsx': '@/layouts/ImportacionesLayout',
  'pages/editoriales/EditorialesLayout.tsx': '@/layouts/EditorialesLayout',
  'pages/reportes/ReportesLayout.tsx': '@/layouts/ReportesLayout',
  'pages/auditoria/AuditoriaLayout.tsx': '@/layouts/AuditoriaLayout',
  'pages/configuracion/ConfiguracionLayout.tsx': '@/layouts/ConfiguracionLayout',
}
for (const [shim, exp] of Object.entries(layoutShims)) {
  writeShim(path.join(SRC, shim), exp)
}

// Fix index.css - restore css import path in main (write note file)
const cssPath = path.join(SRC, 'assets/styles/index.css')
if (fs.existsSync(cssPath) && fs.existsSync(path.join(SRC, 'index.css'))) {
  const idx = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8')
  if (isShim(idx)) {
    fs.copyFileSync(cssPath, path.join(SRC, 'index.css'))
  }
}

// --- Phase 6: Fix imports in modules, layouts, components subfolders ---
const IMPORT_REPLACEMENTS = [
  [/from ['"](\.\.\/)+components\/ui\//g, "from '@/components/ui/"],
  [/from ['"](\.\.\/)+components\/layout\//g, "from '@/components/layout/"],
  [/from ['"](\.\.\/)+components\/ventas\//g, "from '@/modules/ventas/components/"],
  [/from ['"](\.\.\/)+components\/eventos\//g, "from '@/modules/eventos/components/"],
  [/from ['"](\.\.\/)+components\/compras\//g, "from '@/modules/compras/components/"],
  [/from ['"](\.\.\/)+components\/importaciones\//g, "from '@/modules/importaciones/components/"],
  [/from ['"](\.\.\/)+components\/inventario\//g, "from '@/modules/inventario/components/"],
  [/from ['"](\.\.\/)+components\/admin\//g, "from '@/modules/admin/components/"],
  [/from ['"](\.\.\/)+data\//g, "from '@/mocks/"],
  [/from ['"]\.\.\/data\/salesMockData['"]/g, "from '@/mocks/mockVentas'"],
  [/from ['"]\.\.\/data\/mockData['"]/g, "from '@/mocks/mockCore'"],
  [/from ['"]\.\.\/data\/adminMockData['"]/g, "from '@/mocks/mockAdmin'"],
  [/from ['"]\.\.\/data\/eventsMockData['"]/g, "from '@/mocks/mockEventos'"],
  [/from ['"]\.\.\/data\/purchasesMockData['"]/g, "from '@/mocks/mockCompras'"],
  [/from ['"]\.\.\/data\/importsMockData['"]/g, "from '@/mocks/mockImportaciones'"],
  [/from ['"]\.\.\/data\/inventoryMockData['"]/g, "from '@/mocks/mockInventario'"],
  [/from ['"]\.\.\/data\/staffAssignmentData['"]/g, "from '@/mocks/mockStaff'"],
  [/from ['"]\.\.\/data\/usersMockData['"]/g, "from '@/mocks/mockUsuarios'"],
  [/from ['"]\.\.\/data\/auditMockData['"]/g, "from '@/mocks/mockAuditoria'"],
  [/from ['"]\.\.\/data\/configMockData['"]/g, "from '@/mocks/mockConfiguracion'"],
  [/from ['"]\.\.\/data\/helpMockData['"]/g, "from '@/mocks/mockAyuda'"],
  [/from ['"](\.\.\/)+context\//g, "from '@/context/"],
  [/from ['"](\.\.\/)+store\//g, "from '@/store/"],
  [/from ['"](\.\.\/)+services\//g, "from '@/services/"],
  [/from ['"](\.\.\/)+utils\//g, "from '@/utils/"],
  [/from ['"](\.\.\/)+types\/domain['"]/g, "from '@/types/domain'"],
  [/from ['"](\.\.\/)+types\/eventExtended['"]/g, "from '@/modules/eventos/types/eventExtended'"],
  [/from ['"](\.\.\/)+types\/salesExchange['"]/g, "from '@/modules/ventas/types/salesExchange'"],
  [/from ['"](\.\.\/)+lib\/eventBudget['"]/g, "from '@/modules/eventos/utils/eventBudget'"],
  [/from ['"](\.\.\/)+lib\/eventFieldLock['"]/g, "from '@/modules/eventos/utils/eventFieldLock'"],
  [/from ['"](\.\.\/)+lib\/salesExchange['"]/g, "from '@/modules/ventas/utils/salesExchange'"],
  [/from ['"](\.\.\/)+lib\/useTableExport['"]/g, "from '@/hooks/useTableExport'"],
  [/from ['"](\.\.\/)+lib\/staffAssignmentEngine['"]/g, "from '@/lib/staffAssignmentEngine'"],
  [/from ['"](\.\.\/)+lib\/publisherContractStatus['"]/g, "from '@/lib/publisherContractStatus'"],
  [/from ['"](\.\.\/)+business-rules\/stateMachines['"]/g, "from '@/constants/stateMachines'"],
  [/from ['"](\.\.\/)+business-rules\//g, "from '@/business-rules/"],
  [/from ['"]\.\.\/ui\//g, "from '@/components/ui/"],
  [/from ['"]\.\.\/cards\//g, "from '@/components/cards/"],
  [/from ['"]\.\.\/tables\//g, "from '@/components/tables/"],
  [/from ['"]\.\.\/dialogs\//g, "from '@/components/dialogs/"],
  [/from ['"]\.\.\/\.\.\/components\/ui\//g, "from '@/components/ui/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/components\/ui\//g, "from '@/components/ui/"],
]

const fixDirs = [
  path.join(SRC, 'modules'),
  path.join(SRC, 'layouts'),
  path.join(SRC, 'components/cards'),
  path.join(SRC, 'components/tables'),
  path.join(SRC, 'components/dialogs'),
  path.join(SRC, 'hooks'),
  path.join(SRC, 'context'),
  path.join(SRC, 'store'),
  path.join(SRC, 'services'),
  path.join(SRC, 'pages'),
  path.join(SRC, 'App.tsx'),
]

let importFixCount = 0
for (const dir of fixDirs) {
  const files = typeof dir === 'string' && dir.endsWith('App.tsx') && fs.existsSync(dir)
    ? [dir]
    : fs.existsSync(dir)
      ? walk(dir)
      : []
  for (const file of files) {
    if (file.endsWith('.css')) continue
    let content = fs.readFileSync(file, 'utf8')
    if (isShim(content) && !file.includes('data/') && !file.includes('components/ui/')) continue
    const orig = content
    for (const [pat, rep] of IMPORT_REPLACEMENTS) {
      content = content.replace(pat, rep)
    }
    if (content !== orig) {
      fs.writeFileSync(file, content)
      importFixCount++
    }
  }
}

// Fix layouts relative imports
for (const file of walk(path.join(SRC, 'layouts'))) {
  let c = fs.readFileSync(file, 'utf8')
  c = c.replace(/from ['"]\.\.\/\.\.\/components\/ui\//g, "from '@/components/ui/")
  fs.writeFileSync(file, c)
}

// mocks index barrel
const mocksIndex = `export * from './mockCore'
export * from './mockAdmin'
export * from './mockVentas'
export * from './mockEventos'
export * from './mockImportaciones'
export * from './mockCompras'
export * from './mockInventario'
export * from './mockStaff'
export * from './mockUsuarios'
export * from './mockAuditoria'
export * from './mockConfiguracion'
export * from './mockAyuda'
`
fs.writeFileSync(path.join(SRC, 'mocks/index.ts'), mocksIndex)

console.log(`Import fixes in ${importFixCount} files`)
console.log('Repair complete.')
