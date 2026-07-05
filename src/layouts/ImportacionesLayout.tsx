import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Ship,
  FileText,
  Layers,
  DollarSign,
  Calculator,
  Package,
} from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/importaciones', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/importaciones/embarques', label: 'Embarques', icon: Ship },
  { to: '/importaciones/facturas', label: 'Facturas Internacionales', icon: FileText },
  { to: '/importaciones/consolidaciones', label: 'Consolidaciones', icon: Layers },
  { to: '/importaciones/costos', label: 'Costos de Flete', icon: DollarSign },
  { to: '/importaciones/costeo', label: 'Costeo por Libro', icon: Calculator },
  { to: '/importaciones/pallets', label: 'Pallets y Cajas', icon: Package },
]

export function ImportacionesLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
