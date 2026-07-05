import { Package, ShoppingCart, ShoppingBag, Building2, CalendarDays, Ship } from 'lucide-react'
import { QuickAccessGrid } from '@/modules/admin/components/QuickAccessGrid'
import { kardexMovements } from '@/mocks/mockInventario'
import { salesHistory } from '@/mocks/mockVentas'
import { purchaseOrders } from '@/mocks/mockCompras'
import { adminPublishers } from '@/mocks/mockAdmin'
import { eventBudgets } from '@/mocks/mockEventos'
import { shipments } from '@/mocks/mockImportaciones'

const reportItems = [
  {
    to: '/reportes/inventario',
    icon: Package,
    label: 'Inventario',
    description: 'Kardex, ubicaciones y ajustes de stock',
    count: kardexMovements.length,
  },
  {
    to: '/reportes/ventas',
    icon: ShoppingCart,
    label: 'Ventas',
    description: 'Facturación, clientes y productos top',
    count: salesHistory.length,
  },
  {
    to: '/reportes/compras',
    icon: ShoppingBag,
    label: 'Compras',
    description: 'Órdenes de compra y recepciones',
    count: purchaseOrders.length,
  },
  {
    to: '/reportes/editoriales',
    icon: Building2,
    label: 'Editoriales',
    description: 'Contratos y catálogo por editorial',
    count: adminPublishers.length,
  },
  {
    to: '/reportes/eventos',
    icon: CalendarDays,
    label: 'Eventos',
    description: 'Presupuestos, costos e ingresos por evento',
    count: eventBudgets.length,
  },
  {
    to: '/reportes/importaciones',
    icon: Ship,
    label: 'Importaciones',
    description: 'Embarques, costos y costeo por libro',
    count: shipments.length,
  },
]

export function ReportesHub() {
  return (
    <div>
      <QuickAccessGrid items={reportItems} />
    </div>
  )
}
