import { Outlet } from 'react-router-dom'
import { LayoutDashboard, Building2, FileText, RefreshCw, Handshake, BookOpen } from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/editoriales', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/editoriales/lista', label: 'Editoriales', icon: Building2 },
  { to: '/editoriales/contratos', label: 'Contratos', icon: FileText },
  { to: '/editoriales/renovaciones', label: 'Renovaciones', icon: RefreshCw },
  { to: '/editoriales/condiciones', label: 'Condiciones', icon: Handshake },
  { to: '/editoriales/productos', label: 'Productos', icon: BookOpen },
]

export function EditorialesLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
