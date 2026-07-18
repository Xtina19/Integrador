import type { ERPState } from '@/store/initialState'
import { adminProducts, adminCategories, adminPublishers, adminSuppliers, adminBranches, adminCurrencies, publisherContracts } from '@/mocks/mockAdmin'
import { salesHistory } from '@/mocks/mockVentas'
import { supplierInvoices } from '@/mocks/mockCompras'
import { auditActivities, auditChanges, auditAccess, auditDeletions } from '@/mocks/mockAuditoria'
import { configSections } from '@/mocks/mockConfiguracion'
import { mfaSettings, activeSessions } from '@/mocks/mockUsuarios'
import { extractCountry } from '../lib/importSearchUtils'

export type GlobalSearchRecordType =
  | 'product'
  | 'purchase_order'
  | 'shipment'
  | 'invoice'
  | 'consolidation'
  | 'transfer'
  | 'event'
  | 'user'
  | 'publisher'
  | 'supplier'
  | 'sale'
  | 'audit'
  | 'config'
  | 'category'
  | 'branch'
  | 'report'
  | 'dashboard'

export interface GlobalSearchResult {
  id: string
  title: string
  subtitle?: string
  moduleLabel: string
  path: string
  recordType: GlobalSearchRecordType
  openInDialog?: boolean
  score: number
}

function norm(value: string | number | undefined | null) {
  return String(value ?? '').toLowerCase()
}

function matches(query: string, ...fields: (string | number | undefined | null)[]) {
  if (!query.trim()) return false
  const q = query.trim().toLowerCase()
  return fields.some((f) => norm(f).includes(q))
}

function scoreMatch(query: string, primary: string, ...secondary: string[]) {
  const q = query.trim().toLowerCase()
  const p = primary.toLowerCase()
  if (p === q) return 100
  if (p.startsWith(q)) return 80
  if (secondary.some((s) => s.toLowerCase() === q)) return 70
  if (p.includes(q)) return 50
  if (secondary.some((s) => s.toLowerCase().includes(q))) return 30
  return 10
}

function push(results: GlobalSearchResult[], item: Omit<GlobalSearchResult, 'score'>, query: string, primary: string, ...secondary: string[]) {
  if (!matches(query, primary, ...secondary)) return
  results.push({ ...item, score: scoreMatch(query, primary, ...secondary) })
}

const REPORT_LINKS = [
  { id: 'rep-inventario', title: 'Reporte de Inventario', keywords: ['reporte inventario', 'inventario reporte'], path: '/reportes/inventario' },
  { id: 'rep-ventas', title: 'Reporte de Ventas', keywords: ['reporte ventas', 'ventas reporte'], path: '/reportes/ventas' },
  { id: 'rep-compras', title: 'Reporte de Compras', keywords: ['reporte compras', 'compras reporte'], path: '/reportes/compras' },
  { id: 'rep-editoriales', title: 'Reporte de Editoriales', keywords: ['reporte editoriales', 'editoriales reporte'], path: '/reportes/editoriales' },
  { id: 'rep-eventos', title: 'Reporte de Eventos', keywords: ['reporte eventos', 'eventos reporte', 'ferias reporte'], path: '/reportes/eventos' },
  { id: 'rep-importaciones', title: 'Reporte de Importaciones', keywords: ['reporte importaciones', 'importaciones reporte'], path: '/reportes/importaciones' },
]

export function searchGlobal(query: string, state: ERPState): GlobalSearchResult[] {
  if (!query.trim()) return []

  const results: GlobalSearchResult[] = []
  const q = query.trim()

  if (matches(q, 'dashboard', 'inicio', 'resumen', 'kpi')) {
    push(results, { id: 'dashboard', title: 'Dashboard', subtitle: 'Resumen general del sistema', moduleLabel: 'Dashboard', path: '/', recordType: 'dashboard' }, q, 'dashboard', 'inicio', 'resumen')
  }

  for (const p of state.products) {
    push(
      results,
      {
        id: p.id,
        title: p.title,
        subtitle: `${p.isbn} · ${p.category}`,
        moduleLabel: 'Inventario',
        path: '/inventario',
        recordType: 'product',
        openInDialog: false,
      },
      q,
      p.title,
      p.id,
      p.isbn,
      p.author,
      p.category,
      p.publisher,
      p.location
    )
  }

  for (const p of adminProducts) {
    push(
      results,
      {
        id: p.id,
        title: p.title,
        subtitle: `${p.code} · Administración`,
        moduleLabel: 'Administración',
        path: `/administracion/productos/ver/${p.id}`,
        recordType: 'product',
      },
      q,
      p.title,
      p.id,
      p.code,
      p.isbn,
      p.author,
      p.category
    )
  }

  for (const s of salesHistory) {
    push(
      results,
      { id: s.id, title: s.id, subtitle: `${s.customer} · ${s.branch}`, moduleLabel: 'Ventas', path: '/ventas/historial', recordType: 'sale', openInDialog: false },
      q,
      s.id,
      s.customer,
      s.branch
    )
  }

  for (const o of state.purchaseOrders) {
    push(
      results,
      {
        id: o.id,
        title: o.id,
        subtitle: `${o.supplier} · ${o.status}`,
        moduleLabel: 'Compras',
        path: '/compras/ordenes',
        recordType: 'purchase_order',
        openInDialog: true,
      },
      q,
      o.id,
      o.supplier,
      o.status,
      o.purchaseType
    )
  }

  for (const inv of supplierInvoices) {
    push(
      results,
      { id: inv.id, title: inv.id, subtitle: `${inv.supplier} · OC ${inv.orderId}`, moduleLabel: 'Compras', path: '/compras/facturas', recordType: 'purchase_order' },
      q,
      inv.id,
      inv.supplier,
      inv.orderId
    )
  }

  for (const s of state.shipments) {
    push(
      results,
      {
        id: s.id,
        title: s.code,
        subtitle: `${extractCountry(s.origin)} → ${s.destination}`,
        moduleLabel: 'Importaciones',
        path: '/importaciones/embarques',
        recordType: 'shipment',
        openInDialog: true,
      },
      q,
      s.code,
      s.id,
      s.orderId ?? '',
      s.invoiceId ?? '',
      s.origin,
      s.destination,
      s.supplier ?? ''
    )
  }

  for (const f of state.internationalInvoices) {
    push(
      results,
      {
        id: f.id,
        title: f.id,
        subtitle: `${f.supplier} · ${f.shipmentCode ?? 'Sin embarque'}`,
        moduleLabel: 'Importaciones',
        path: '/importaciones/facturas',
        recordType: 'invoice',
        openInDialog: true,
      },
      q,
      f.id,
      f.supplier,
      f.orderId,
      f.shipmentCode ?? '',
      f.currency
    )
  }

  for (const c of state.consolidations) {
    const codes = c.shipmentIds.map((id) => state.shipments.find((s) => s.id === id)?.code ?? id).join(', ')
    push(
      results,
      {
        id: c.id,
        title: c.name,
        subtitle: c.id,
        moduleLabel: 'Importaciones',
        path: '/importaciones/consolidaciones',
        recordType: 'consolidation',
        openInDialog: true,
      },
      q,
      c.id,
      c.name,
      codes,
      c.orderIds.join(' ')
    )
  }

  for (const t of state.transfers) {
    push(
      results,
      {
        id: t.id,
        title: t.id,
        subtitle: `${t.product} · ${t.origin} → ${t.destination}`,
        moduleLabel: 'Inventario',
        path: '/inventario?tab=transferencias',
        recordType: 'transfer',
        openInDialog: false,
      },
      q,
      t.id,
      t.product,
      t.origin,
      t.destination,
      t.status
    )
  }

  for (const e of state.events) {
    push(
      results,
      {
        id: e.id,
        title: e.name,
        subtitle: `${e.location} · ${e.startDate}`,
        moduleLabel: 'Eventos y Ferias',
        path: '/eventos',
        recordType: 'event',
        openInDialog: false,
      },
      q,
      e.name,
      e.id,
      e.type,
      e.location,
      e.startDate
    )
  }

  for (const pub of adminPublishers) {
    push(
      results,
      {
        id: pub.id,
        title: pub.name,
        subtitle: `${pub.country} · ${pub.contractType}`,
        moduleLabel: 'Editoriales',
        path: `/editoriales/ver/${pub.id}`,
        recordType: 'publisher',
      },
      q,
      pub.name,
      pub.id,
      pub.country,
      pub.contact
    )
  }

  for (const c of publisherContracts) {
    push(
      results,
      {
        id: c.id,
        title: c.name,
        subtitle: `${c.publisherName} · ${c.code}`,
        moduleLabel: 'Editoriales',
        path: '/editoriales/contratos',
        recordType: 'publisher',
      },
      q,
      c.code,
      c.name,
      c.publisherName,
      c.id,
      c.type
    )
  }

  for (const u of mfaSettings) {
    push(
      results,
      {
        id: u.user,
        title: u.name,
        subtitle: u.user,
        moduleLabel: 'Usuarios',
        path: '/usuarios',
        recordType: 'user',
        openInDialog: false,
      },
      q,
      u.name,
      u.user,
      u.method
    )
  }

  for (const s of activeSessions) {
    push(
      results,
      { id: s.user, title: s.name, subtitle: s.user, moduleLabel: 'Usuarios', path: '/usuarios', recordType: 'user' },
      q,
      s.name,
      s.user
    )
  }

  for (const s of adminSuppliers) {
    push(
      results,
      {
        id: s.id,
        title: s.name,
        subtitle: s.supplierType,
        moduleLabel: 'Administración',
        path: `/administracion/proveedores/ver/${s.id}`,
        recordType: 'supplier',
      },
      q,
      s.name,
      s.id,
      s.email,
      s.supplierType
    )
  }

  for (const cat of adminCategories) {
    push(
      results,
      {
        id: cat.id,
        title: cat.name,
        subtitle: cat.description,
        moduleLabel: 'Administración',
        path: `/administracion/categorias/ver/${cat.id}`,
        recordType: 'category',
      },
      q,
      cat.name,
      cat.id,
      cat.description
    )
  }

  for (const b of adminBranches) {
    push(
      results,
      {
        id: b.id,
        title: b.name,
        subtitle: b.city,
        moduleLabel: 'Administración',
        path: `/administracion/sucursales/ver/${b.id}`,
        recordType: 'branch',
      },
      q,
      b.name,
      b.id,
      b.city,
      b.manager
    )
  }

  for (const c of adminCurrencies) {
    push(
      results,
      {
        id: c.id,
        title: `${c.code} — ${c.name}`,
        subtitle: c.symbol,
        moduleLabel: 'Administración',
        path: `/administracion/monedas/ver/${c.id}`,
        recordType: 'config',
      },
      q,
      c.code,
      c.name,
      c.id
    )
  }

  for (const a of [...auditActivities, ...auditChanges, ...auditAccess, ...auditDeletions]) {
    const action = 'action' in a ? a.action : 'entity' in a ? `${(a as { entity: string }).entity}` : ''
    push(
      results,
      {
        id: a.id,
        title: a.id,
        subtitle: action,
        moduleLabel: 'Auditoría',
        path: '/auditoria/cambios',
        recordType: 'audit',
      },
      q,
      a.id,
      action,
      'module' in a ? (a as { module: string }).module : '',
      'user' in a ? (a as { user: string }).user : ''
    )
  }

  for (const section of configSections) {
    for (const item of section.items) {
      push(
        results,
        {
          id: `${section.id}-${item.key}`,
          title: item.label,
          subtitle: section.title,
          moduleLabel: 'Configuración',
          path: '/configuracion/general',
          recordType: 'config',
        },
        q,
        item.label,
        item.value,
        section.title
      )
    }
  }

  for (const act of state.activities) {
    push(
      results,
      {
        id: act.id,
        title: act.message,
        subtitle: act.module,
        moduleLabel: 'Dashboard',
        path: '/',
        recordType: 'dashboard',
      },
      q,
      act.message,
      act.module
    )
  }

  for (const rep of REPORT_LINKS) {
    if (matches(q, rep.title, ...rep.keywords)) {
      results.push({
        id: rep.id,
        title: rep.title,
        moduleLabel: 'Reportes',
        path: rep.path,
        recordType: 'report',
        score: scoreMatch(q, rep.title, ...rep.keywords),
      })
    }
  }

  const seen = new Set<string>()
  return results
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      const key = `${r.recordType}:${r.id}:${r.path}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 15)
}

export type GlobalSearchIconKey =
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'imports'
  | 'transfers'
  | 'publishers'
  | 'events'
  | 'users'
  | 'admin'
  | 'reports'
  | 'audit'
  | 'config'

export function getSearchResultIconKey(recordType: GlobalSearchRecordType): GlobalSearchIconKey {
  const map: Record<GlobalSearchRecordType, GlobalSearchIconKey> = {
    product: 'inventory',
    purchase_order: 'purchases',
    shipment: 'imports',
    invoice: 'imports',
    consolidation: 'imports',
    transfer: 'transfers',
    event: 'events',
    user: 'users',
    publisher: 'publishers',
    supplier: 'admin',
    sale: 'sales',
    audit: 'audit',
    config: 'config',
    category: 'admin',
    branch: 'admin',
    report: 'reports',
    dashboard: 'dashboard',
  }
  return map[recordType]
}
