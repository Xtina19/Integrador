import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Building2,
  CalendarDays,
  Ship,
} from 'lucide-react'
import { ModuleTabs } from '../../components/ui/ModuleTabs'

const tabs = [
  { to: '/reportes', label: 'General', icon: LayoutDashboard, end: true },
  { to: '/reportes/inventario', label: 'Inventario', icon: Package },
  { to: '/reportes/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/reportes/compras', label: 'Compras', icon: ShoppingBag },
  { to: '/reportes/editoriales', label: 'Editoriales', icon: Building2 },
  { to: '/reportes/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/reportes/importaciones', label: 'Importaciones', icon: Ship },
]

export function ReportesLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
