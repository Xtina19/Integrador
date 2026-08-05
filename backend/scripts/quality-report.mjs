/**
 * Script de calidad (sin frameworks externos de análisis).
 * Ejecutar: npm run quality:report
 */
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(process.cwd(), 'src', 'modules', 'inventario')

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else if (full.endsWith('.ts')) acc.push(full)
  }
  return acc
}

const files = existsSync(root) ? walk(root) : []
const tests = files.filter((f) => f.includes('.test.ts'))
const domain = files.filter((f) => f.includes(`${join('domain')}`))
const application = files.filter((f) => f.includes(`${join('application')}`))
const infrastructure = files.filter((f) => f.includes(`${join('infrastructure')}`))

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    tsFiles: files.length,
    testFiles: tests.length,
    domainFiles: domain.length,
    applicationFiles: application.length,
    infrastructureFiles: infrastructure.length,
  },
  dependenciesReview: {
    runtime: ['express', 'cors', 'dotenv', 'mssql (legacy only)'],
    notes: [
      'El módulo Inventario TS no requiere mssql en runtime actual (memory adapter).',
      'No se añadieron loggers externos para mantener el núcleo liviano.',
    ],
  },
  duplicationNotes: [
    'Fakes de application/testing vs repos infrastructure: intencional por capas.',
    'Validators HTTP y DTOs alineados; mappers delegan en validators.',
  ],
  staticChecks: [
    'TypeScript strict (tsc --noEmit)',
    'Vitest suite',
    'Arquitectura hexagonal documentada',
  ],
  files: files.map((f) => relative(process.cwd(), f)),
}

const outDir = join(process.cwd(), 'src', 'modules', 'inventario', 'docs')
writeFileSync(join(outDir, 'QUALITY_REPORT.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report.totals, null, 2))
console.log('Wrote docs/QUALITY_REPORT.json')
