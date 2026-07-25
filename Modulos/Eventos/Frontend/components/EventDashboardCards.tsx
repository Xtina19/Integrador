import {
  Calendar,
  Users,
  BookOpen,
  ShoppingCart,
  DollarSign,
  Wallet,
  UserCheck,
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { computeEventBudgetSummary } from '@/modules/eventos/utils/eventBudget'
import type { LibroSysEvent } from '@/types/domain'
import type { EventExtendedData } from '@/modules/eventos/types/eventExtended'
import { eventStatusLabels } from '@/constants/stateMachines'
import { formatDop } from '@/lib/money'

interface EventDashboardCardsProps {
  event: LibroSysEvent
  extended: EventExtendedData
  salesTotal: number
  staffCount: number
}

export function EventDashboardCards({ event, extended, salesTotal, staffCount }: EventDashboardCardsProps) {
  const budget = computeEventBudgetSummary(event.budget ?? 0, extended.utensils, extended.operationalCost)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Estado"
        value={eventStatusLabels[event.status]}
        detail={event.type === 'feria' ? 'Feria' : 'Evento'}
        icon={<Calendar size={20} />}
      />
      <StatCard
        title="Personal asignado"
        value={staffCount}
        detail="Colaboradores confirmados"
        icon={<Users size={20} />}
      />
      <StatCard
        title="Editoriales"
        value={extended.publishers.length}
        detail="Participantes"
        icon={<BookOpen size={20} />}
      />
      <StatCard
        title="Productos enviados"
        value={extended.inventory.reduce((s, i) => s + i.qty, 0)}
        detail={`${extended.inventory.length} líneas`}
        icon={<ShoppingCart size={20} />}
      />
      <StatCard
        title="Ventas realizadas"
        value={formatDop(salesTotal)}
        detail="En feria (simulado)"
        icon={<DollarSign size={20} />}
      />
      <StatCard
        title="Costo acumulado"
        value={formatDop(budget.totalSpent)}
        detail="Utensilios + operativo"
        icon={<Wallet size={20} />}
      />
      <StatCard
        title="Presupuesto restante"
        value={formatDop(budget.available)}
        detail={`De ${formatDop(budget.budget)}`}
        icon={<Wallet size={20} />}
      />
      <StatCard
        title="Visitantes estimados"
        value={extended.capacity || '—'}
        detail="Capacidad del evento"
        icon={<UserCheck size={20} />}
      />
    </div>
  )
}
