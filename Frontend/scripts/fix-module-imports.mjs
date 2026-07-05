/**
 * Rewrites relative imports in moved module files to use @/ alias.
 */
import fs from 'fs'
import path from 'path'

const SRC = path.resolve('src')
const TARGET_DIRS = [
  'modules',
  'layouts',
  'components/cards',
  'components/tables',
  'components/dialogs',
  'mocks',
  'constants',
  'hooks',
  'routes',
]

const REPLACEMENTS = [
  [/from ['"](\.\.\/)+components\/ui\//g, "from '@/components/ui/"],
  [/from ['"](\.\.\/)+components\/layout\//g, "from '@/components/layout/"],
  [/from ['"](\.\.\/)+components\/ventas\//g, "from '@/modules/ventas/components/"],
  [/from ['"](\.\.\/)+components\/eventos\//g, "from '@/modules/eventos/components/"],
  [/from ['"](\.\.\/)+components\/compras\//g, "from '@/modules/compras/components/"],
  [/from ['"](\.\.\/)+components\/importaciones\//g, "from '@/modules/importaciones/components/"],
  [/from ['"](\.\.\/)+components\/inventario\//g, "from '@/modules/inventario/components/"],
  [/from ['"](\.\.\/)+components\/admin\//g, "from '@/modules/admin/components/"],
  [/from ['"](\.\.\/)+data\//g, "from '@/mocks/"],
  [/from ['"](\.\.\/)+mocks\/mockData/g, "from '@/mocks/mockCore"],
  [/from ['"](\.\.\/)+mocks\/adminMockData/g, "from '@/mocks/mockAdmin"],
  [/from ['"](\.\.\/)+mocks\/salesMockData/g, "from '@/mocks/mockVentas"],
  [/from ['"](\.\.\/)+mocks\/eventsMockData/g, "from '@/mocks/mockEventos"],
  [/from ['"](\.\.\/)+mocks\/importsMockData/g, "from '@/mocks/mockImportaciones"],
  [/from ['"](\.\.\/)+mocks\/purchasesMockData/g, "from '@/mocks/mockCompras"],
  [/from ['"](\.\.\/)+mocks\/inventoryMockData/g, "from '@/mocks/mockInventario"],
  [/from ['"](\.\.\/)+mocks\/staffAssignmentData/g, "from '@/mocks/mockStaff"],
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
  [/from ['"](\.\.\/)+pages\/ventas\/VentasLayout['"]/g, "from '@/layouts/VentasLayout'"],
  [/from ['"](\.\.\/)+pages\/compras\/ComprasLayout['"]/g, "from '@/layouts/ComprasLayout'"],
  [/from ['"](\.\.\/)+pages\/importaciones\/ImportacionesLayout['"]/g, "from '@/layouts/ImportacionesLayout'"],
  [/from ['"](\.\.\/)+pages\/editoriales\/EditorialesLayout['"]/g, "from '@/layouts/EditorialesLayout'"],
  [/from ['"](\.\.\/)+pages\/reportes\/ReportesLayout['"]/g, "from '@/layouts/ReportesLayout'"],
  [/from ['"](\.\.\/)+pages\/auditoria\/AuditoriaLayout['"]/g, "from '@/layouts/AuditoriaLayout'"],
  [/from ['"](\.\.\/)+pages\/configuracion\/ConfiguracionLayout['"]/g, "from '@/layouts/ConfiguracionLayout'"],
  [/from ['"]\.\.\/ui\//g, "from '@/components/ui/"],
  [/from ['"]\.\.\/cards\//g, "from '@/components/cards/"],
  [/from ['"]\.\.\/tables\//g, "from '@/components/tables/"],
  [/from ['"]\.\.\/dialogs\//g, "from '@/components/dialogs/"],
]

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.tsx?$/.test(entry.name)) files.push(full)
  }
  return files
}

let count = 0
for (const dir of TARGET_DIRS) {
  for (const file of walk(path.join(SRC, dir))) {
    let content = fs.readFileSync(file, 'utf8')
    const original = content
    for (const [pattern, replacement] of REPLACEMENTS) {
      content = content.replace(pattern, replacement)
    }
    if (content !== original) {
      fs.writeFileSync(file, content)
      count++
    }
  }
}
console.log(`Fixed imports in ${count} files under target dirs`)
