import { Outlet } from 'react-router-dom'
import { Settings, Bell, Mail } from 'lucide-react'
import { ModuleTabs } from '../../components/ui/ModuleTabs'

const tabs = [
  { to: '/configuracion', label: 'General', icon: Settings, end: true },
  { to: '/configuracion/notificaciones', label: 'Notificaciones', icon: Bell },
  { to: '/configuracion/correos', label: 'Correos', icon: Mail },
]

export function ConfiguracionLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
