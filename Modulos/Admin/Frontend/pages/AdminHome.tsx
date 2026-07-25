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
import { StatCard } from '@/components/ui/Card'
import { QuickAccessGrid } from '@/modules/admin/components/QuickAccessGrid'
import { adminStats } from '@/mocks/mockAdmin'
import { useClientesCatalog } from '@/context/ClientesCatalogContext'

export function AdminHome() {
  const { clientes } = useClientesCatalog()
  const activos = clientes.filter((c) => c.estado === 'activo').length

  const quickAccessItems = [
    { to: '/administracion/productos', icon: BookOpen, label: 'Productos', description: 'Catálogo maestro de productos', count: adminStats.totalProducts },
    { to: '/administracion/categorias', icon: Tag, label: 'Categorías', description: 'Clasificación de productos', count: adminStats.totalCategories },
    { to: '/administracion/sucursales', icon: Store, label: 'Sucursales', description: 'Puntos de venta y almacén', count: adminStats.totalBranches },
    { to: '/administracion/proveedores', icon: Truck, label: 'Proveedores', description: 'Proveedores y distribuidores', count: adminStats.totalSuppliers },
    { to: '/administracion/clientes', icon: UserRound, label: 'Clientes', description: 'Maestro de clientes del ERP', count: clientes.length },
    { to: '/configuracion/monedas', icon: Coins, label: 'Monedas', description: 'Monedas del sistema', count: adminStats.activeCurrencies },
    { to: '/administracion/tasas-cambio', icon: TrendingUp, label: 'Tasas de Cambio', description: 'Tipos de cambio vigentes', count: 4 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          title="Total de Productos"
          value={adminStats.totalProducts.toLocaleString()}
          detail="Catálogo maestro"
          icon={<BookOpen size={22} />}
        />
        <StatCard
          title="Total de Categorías"
          value={adminStats.totalCategories}
          detail="Clasificaciones activas"
          icon={<Tag size={22} />}
        />
        <StatCard
          title="Total de Sucursales"
          value={adminStats.totalBranches}
          detail="Incluye almacén central"
          icon={<Store size={22} />}
        />
        <StatCard
          title="Total de Proveedores"
          value={adminStats.totalSuppliers}
          detail="Proveedores activos"
          icon={<Truck size={22} />}
        />
        <StatCard
          title="Clientes activos"
          value={activos}
          detail={`${clientes.length} en el maestro`}
          icon={<UserRound size={22} />}
        />
        <StatCard
          title="Monedas Activas"
          value={adminStats.activeCurrencies}
          detail="MXN, USD, EUR, DOP"
          icon={<Coins size={22} />}
        />
        <StatCard
          title="Última Actualización"
          value="Hoy"
          detail={adminStats.lastRateUpdate}
          icon={<TrendingUp size={22} />}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-corporate" />
          <h2 className="text-base font-semibold text-gray-900">Accesos Rápidos</h2>
          <span className="text-sm text-gray-500">— Catálogos maestros del sistema</span>
        </div>
        <QuickAccessGrid items={quickAccessItems} />
      </div>
    </div>
  )
}
