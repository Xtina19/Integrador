import fs from 'fs'
import path from 'path'

const SRC = path.join(process.cwd(), 'src')

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, files)
    else if (/\.tsx?$/.test(e.name)) files.push(full)
  }
  return files
}

const REPLACEMENTS = [
  ["@/mocks/adminMockData", '@/mocks/mockAdmin'],
  ["@/mocks/salesMockData", '@/mocks/mockVentas'],
  ["@/mocks/eventsMockData", '@/mocks/mockEventos'],
  ["@/mocks/importsMockData", '@/mocks/mockImportaciones'],
  ["@/mocks/purchasesMockData", '@/mocks/mockCompras'],
  ["@/mocks/inventoryMockData", '@/mocks/mockInventario'],
  ["@/mocks/staffAssignmentData", '@/mocks/mockStaff'],
  ["@/mocks/usersMockData", '@/mocks/mockUsuarios'],
  ["@/mocks/auditMockData", '@/mocks/mockAuditoria'],
  ["@/mocks/configMockData", '@/mocks/mockConfiguracion'],
  ["@/mocks/helpMockData", '@/mocks/mockAyuda'],
  ["@/mocks/mockData", '@/mocks/mockCore'],
  ["from '../../lib/adminConfig'", "from '@/lib/adminConfig'"],
  ["from '../../../lib/adminConfig'", "from '@/lib/adminConfig'"],
  ["from '../../lib/importSearchUtils'", "from '@/lib/importSearchUtils'"],
  ["from '../../../lib/importSearchUtils'", "from '@/lib/importSearchUtils'"],
  ["from '../../types/staffAssignment'", "from '@/types/staffAssignment'"],
  ["from '../../../types/staffAssignment'", "from '@/types/staffAssignment'"],
  ["from '../types/staffAssignment'", "from '@/types/staffAssignment'"],
  ["export * from '../layouts/", "export * from '@/layouts/"],
  ["from './Card'", "from '@/components/cards/Card'"],
  ["from './Button'", "from '@/components/ui/Button'"],
  ["from './exportTable'", "from '@/lib/exportTable'"],
]

let count = 0
for (const file of walk(SRC)) {
  let content = fs.readFileSync(file, 'utf8')
  const orig = content
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to)
  }
  if (content !== orig) {
    fs.writeFileSync(file, content)
    count++
  }
}

console.log(`Fixed imports in ${count} files`)
