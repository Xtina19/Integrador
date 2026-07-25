import { Outlet } from 'react-router-dom'
import { Settings, Bell, Mail, Coins, TrendingUp, CreditCard } from 'lucide-react'
import { ModuleTabs } from '@/components/ui/ModuleTabs'

const tabs = [
  { to: '/configuracion', label: 'General', icon: Settings, end: true },
  { to: '/configuracion/monedas', label: 'Monedas', icon: Coins },
  { to: '/configuracion/tasas-cambio', label: 'Tasas', icon: TrendingUp },
  { to: '/configuracion/formas-pago', label: 'Formas de Pago', icon: CreditCard },
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
