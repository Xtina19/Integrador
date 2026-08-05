import {
  BookOpen,
  Tag,
  Store,
  Truck,
  Coins,
  TrendingUp,
  Settings,
  UserRound,
} from 'lucide-react'
import { QuickAccessGrid } from '@/modules/admin/components/QuickAccessGrid'
import { useClientesCatalog } from '@/context/ClientesCatalogContext'
import { useAdminDashboardCounts } from '@/modules/admin/hooks/useAdminDashboardStats'

export function AdminHome() {
  const { clientes } = useClientesCatalog()
  const counts = useAdminDashboardCounts()

  const quickAccessItems = [
    {
      to: '/inventario/productos',
      icon: BookOpen,
      label: 'Productos',
      description: 'Catálogo maestro',
      count: counts.loading ? undefined : counts.productos,
    },
    {
      to: '/inventario/categorias',
      icon: Tag,
      label: 'Categorías',
      description: 'Clasificación de productos',
      count: counts.loading ? undefined : counts.categorias,
    },
    {
      to: '/inventario/almacenes',
      icon: Store,
      label: 'Almacenes',
      description: 'Sucursales y depósitos',
      count: counts.loading ? undefined : counts.almacenes,
    },
    {
      to: '/compras/proveedores',
      icon: Truck,
      label: 'Proveedores',
      description: 'Distribuidores y compras',
      count: counts.loading ? undefined : counts.proveedores,
    },
    {
      to: '/ventas/clientes',
      icon: UserRound,
      label: 'Clientes',
      description: 'Maestro de clientes',
      count: clientes.length,
    },
    {
      to: '/configuracion/monedas',
      icon: Coins,
      label: 'Monedas',
      description: 'Monedas activas',
      count: counts.loading ? undefined : counts.monedas,
    },
    {
      to: '/configuracion/tasas-cambio',
      icon: TrendingUp,
      label: 'Tasas de Cambio',
      description: 'Tipos de cambio vigentes',
      count: counts.loading ? undefined : counts.tasas,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={18} className="text-corporate" />
        <h2 className="text-base font-semibold text-gray-900">Accesos Rápidos</h2>
        <span className="text-sm text-gray-500">— Catálogos maestros</span>
      </div>
      <QuickAccessGrid items={quickAccessItems} />
    </div>
  )
}
