import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Ship,
  DollarSign,
  Calculator,
} from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/importaciones', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/importaciones/embarques', label: 'Embarques y Consolidaciones', icon: Ship },
  { to: '/importaciones/costos', label: 'Costos de Flete', icon: DollarSign },
  { to: '/importaciones/costeo', label: 'Costeo por Libro', icon: Calculator },
]

export function ImportacionesLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}

