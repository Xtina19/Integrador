import { Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, PackageCheck, Receipt } from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/compras', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/compras/ordenes', label: 'Órdenes de Compra', icon: ShoppingCart },
  { to: '/compras/recepciones', label: 'Recepciones', icon: PackageCheck },
  { to: '/compras/facturas', label: 'Facturas Proveedores', icon: Receipt },
]

export function ComprasLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
