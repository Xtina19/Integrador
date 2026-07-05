import { Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Receipt, ArrowLeftRight } from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/ventas', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ventas/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { to: '/ventas/historial', label: 'Historial', icon: Receipt },
  { to: '/ventas/cambios-notas', label: 'Cambios y Notas de Crédito', icon: ArrowLeftRight },
]

export function VentasLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
