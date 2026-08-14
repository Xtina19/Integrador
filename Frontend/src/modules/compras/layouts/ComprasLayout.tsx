import { Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, PackageCheck, Receipt, Truck, Wallet } from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/compras', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/compras/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/compras/ordenes', label: 'Órdenes de Compra', icon: ShoppingCart },
  { to: '/compras/facturas', label: 'Facturas Proveedores', icon: Receipt },
  { to: '/compras/recepciones', label: 'Recepciones', icon: PackageCheck },
  { to: '/compras/cuentas-por-pagar', label: 'Cuentas por pagar', icon: Wallet },
]

export function ComprasLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
