import { LayoutDashboard, ShoppingCart, Receipt, FileText, UserRound } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/ventas', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ventas/pos', label: 'POS', icon: ShoppingCart },
  { to: '/ventas/facturas', label: 'Facturas', icon: Receipt },
  { to: '/ventas/notas-credito', label: 'Notas de Crédito', icon: FileText },
  { to: '/ventas/clientes', label: 'Clientes', icon: UserRound },
]

export function VentasLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
