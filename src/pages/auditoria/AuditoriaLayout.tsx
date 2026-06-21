import { Outlet } from 'react-router-dom'
import { Activity, FileDiff, LogIn, Trash2 } from 'lucide-react'
import { ModuleTabs } from '../../components/ui/ModuleTabs'

const tabs = [
  { to: '/auditoria', label: 'Actividades', icon: Activity, end: true },
  { to: '/auditoria/cambios', label: 'Cambios', icon: FileDiff },
  { to: '/auditoria/accesos', label: 'Accesos', icon: LogIn },
  { to: '/auditoria/eliminaciones', label: 'Eliminaciones', icon: Trash2 },
]

export function AuditoriaLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
