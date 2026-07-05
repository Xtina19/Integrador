/**
 * Updates relative import paths after LibroSys folder reorganization.
 * Run from project root: node scripts/reorganize-imports.mjs
 */
import fs from 'fs'
import path from 'path'

const SRC = path.resolve('src')

const PATH_REPLACEMENTS = [
  // mocks (formerly data/)
  [/from ['"](\.\.\/)+data\/mockData['"]/g, "from '@/mocks/mockCore'"],
  [/from ['"](\.\.\/)+data\/adminMockData['"]/g, "from '@/mocks/mockAdmin'"],
  [/from ['"](\.\.\/)+data\/salesMockData['"]/g, "from '@/mocks/mockVentas'"],
  [/from ['"](\.\.\/)+data\/eventsMockData['"]/g, "from '@/mocks/mockEventos'"],
  [/from ['"](\.\.\/)+data\/importsMockData['"]/g, "from '@/mocks/mockImportaciones'"],
  [/from ['"](\.\.\/)+data\/purchasesMockData['"]/g, "from '@/mocks/mockCompras'"],
  [/from ['"](\.\.\/)+data\/inventoryMockData['"]/g, "from '@/mocks/mockInventario'"],
  [/from ['"](\.\.\/)+data\/staffAssignmentData['"]/g, "from '@/mocks/mockStaff'"],
  [/from ['"](\.\.\/)+data\/usersMockData['"]/g, "from '@/mocks/mockUsuarios'"],
  [/from ['"](\.\.\/)+data\/auditMockData['"]/g, "from '@/mocks/mockAuditoria'"],
  [/from ['"](\.\.\/)+data\/configMockData['"]/g, "from '@/mocks/mockConfiguracion'"],
  [/from ['"](\.\.\/)+data\/helpMockData['"]/g, "from '@/mocks/mockAyuda'"],
  [/from ['"]\.\/data\/(\w+)['"]/g, "from '@/mocks/mock$1'"],

  // pages -> modules
  [/from ['"]\.\/pages\//g, "from '@/modules/"],
  [/from ['"](\.\.\/)+pages\//g, "from '@/modules/"],

  // domain components -> modules
  [/from ['"](\.\.\/)+components\/ventas\//g, "from '@/modules/ventas/components/"],
  [/from ['"](\.\.\/)+components\/eventos\//g, "from '@/modules/eventos/components/"],
  [/from ['"](\.\.\/)+components\/compras\//g, "from '@/modules/compras/components/"],
  [/from ['"](\.\.\/)+components\/importaciones\//g, "from '@/modules/importaciones/components/"],
  [/from ['"](\.\.\/)+components\/inventario\//g, "from '@/modules/inventario/components/"],
  [/from ['"](\.\.\/)+components\/admin\//g, "from '@/modules/admin/components/"],

  // layouts
  [/from ['"](\.\.\/)+pages\/ventas\/VentasLayout['"]/g, "from '@/layouts/VentasLayout'"],
  [/from ['"](\.\.\/)+pages\/compras\/ComprasLayout['"]/g, "from '@/layouts/ComprasLayout'"],
  [/from ['"](\.\.\/)+pages\/importaciones\/ImportacionesLayout['"]/g, "from '@/layouts/ImportacionesLayout'"],
  [/from ['"](\.\.\/)+pages\/editoriales\/EditorialesLayout['"]/g, "from '@/layouts/EditorialesLayout'"],
  [/from ['"](\.\.\/)+pages\/reportes\/ReportesLayout['"]/g, "from '@/layouts/ReportesLayout'"],
  [/from ['"](\.\.\/)+pages\/auditoria\/AuditoriaLayout['"]/g, "from '@/layouts/AuditoriaLayout'"],
  [/from ['"](\.\.\/)+pages\/configuracion\/ConfiguracionLayout['"]/g, "from '@/layouts/ConfiguracionLayout'"],

  // ventas module types/lib
  [/from ['"](\.\.\/)+types\/salesExchange['"]/g, "from '@/modules/ventas/types/salesExchange'"],
  [/from ['"](\.\.\/)+lib\/salesExchange['"]/g, "from '@/modules/ventas/utils/salesExchange'"],
  [/from ['"](\.\.\/)+types\/eventExtended['"]/g, "from '@/modules/eventos/types/eventExtended'"],
  [/from ['"](\.\.\/)+lib\/eventBudget['"]/g, "from '@/modules/eventos/utils/eventBudget'"],
  [/from ['"](\.\.\/)+lib\/eventFieldLock['"]/g, "from '@/modules/eventos/utils/eventFieldLock'"],

  // constants
  [/from ['"](\.\.\/)+business-rules\/stateMachines['"]/g, "from '@/constants/stateMachines'"],

  // routes
  [/from ['"]\.\/App['"]/g, "from '@/App'"],
  [/from ['"]\.\/index\.css['"]/g, "from '@/assets/styles/index.css'"],

  // store, context, services - use alias
  [/from ['"](\.\.\/)+store\//g, "from '@/store/"],
  [/from ['"](\.\.\/)+context\//g, "from '@/context/"],
  [/from ['"](\.\.\/)+services\//g, "from '@/services/"],
  [/from ['"](\.\.\/)+utils\//g, "from '@/utils/"],
  [/from ['"](\.\.\/)+types\/domain['"]/g, "from '@/types/domain'"],
  [/from ['"](\.\.\/)+business-rules\//g, "from '@/business-rules/"],
  [/from ['"](\.\.\/)+lib\//g, "from '@/lib/"],
  [/from ['"](\.\.\/)+components\/layout\//g, "from '@/components/layout/"],
  [/from ['"](\.\.\/)+components\/ui\//g, "from '@/components/ui/"],
  [/from ['"](\.\.\/)+components\/dialogs\//g, "from '@/components/dialogs/"],
  [/from ['"](\.\.\/)+components\/tables\//g, "from '@/components/tables/"],
  [/from ['"](\.\.\/)+components\/cards\//g, "from '@/components/cards/"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push(full)
  }
  return files
}

let updated = 0
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [pattern, replacement] of PATH_REPLACEMENTS) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    fs.writeFileSync(file, content)
    updated++
  }
}
console.log(`Updated imports in ${updated} files`)
