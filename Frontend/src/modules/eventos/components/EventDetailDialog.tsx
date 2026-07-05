import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import type { LibroSysEvent } from '@/types/domain'
import type { DetailEventTab } from '@/modules/eventos/types/eventExtended'
import { EventModalShell, EventTabBar } from './EventTabBar'
import { EventDashboardCards } from './EventDashboardCards'
import { EventBudgetSummary } from './EventBudgetSummary'
import { EventInventoryTabContent } from './EventInventoryTabContent'
import { EventUtensilsTabContent } from './EventUtensilsTabContent'
import { EventStaffTabContent } from './EventStaffTabContent'
import { DetailRow } from '@/components/ui/FormDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { useEventExtended } from '@/context/EventExtendedContext'
import { useStaffAssignment } from '@/context/StaffAssignmentContext'
import { getEventHistory, getEventSales } from '@/mocks/mockEventos'
import { eventStatusLabels } from '@/constants/stateMachines'
import type { StaffAssignmentResult } from '@/types/staffAssignment'

const DETAIL_TABS: { id: DetailEventTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'personal', label: 'Personal' },
  { id: 'utensilios', label: 'Utensilios' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'historial', label: 'Historial' },
]

interface EventDetailDialogProps {
  event: LibroSysEvent | null
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export function EventDetailDialog({ event, open, onClose, onEdit }: EventDetailDialogProps) {
  const { getExtended } = useEventExtended()
  const { history } = useStaffAssignment()
  const [activeTab, setActiveTab] = useState<DetailEventTab>('resumen')

  const extended = useMemo(() => (event ? getExtended(event.id) : null), [event, getExtended])
  const sales = useMemo(() => (event ? getEventSales(event.id) : []), [event])
  const eventHistory = useMemo(() => (event ? getEventHistory(event.id) : []), [event])

  const staffAssignment = useMemo((): StaffAssignmentResult['assignments'] => {
    const empty: StaffAssignmentResult['assignments'] = { ventas: [], inventario: [], logistica: [], caja: [] }
    if (!event) return empty
    const records = history.filter((r) => r.eventId === event.id && r.status === 'confirmed')
    const result: StaffAssignmentResult['assignments'] = { ...empty }
    for (const r of records) {
      result[r.area].push({ employeeId: r.employeeId, employeeName: r.employeeName, area: r.area })
    }
    return result
  }, [event, history])

  const staffCount = history.filter((r) => event && r.eventId === event.id).length || event?.participants || 0
  const salesTotal = sales.reduce((s, sale) => s + (sale.status === 'paid' ? sale.total : 0), 0)

  if (!event || !extended) return null

  const canEdit = event.status !== 'finalized'

  return (
    <EventModalShell
      open={open}
      onClose={onClose}
      title={event.name}
      subtitle={`${event.id} · ${event.location}`}
      maxWidth="5xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {canEdit && (
            <Button variant="outline" icon={Pencil} onClick={onEdit}>
              Editar
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <EventTabBar tabs={DETAIL_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'resumen' && (
          <div className="space-y-6">
            <EventDashboardCards
              event={event}
              extended={extended}
              salesTotal={salesTotal}
              staffCount={staffCount}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EventBudgetSummary
                budget={event.budget ?? 0}
                utensils={extended.utensils}
                operationalCost={extended.operationalCost}
                readOnly
              />
              <div className="space-y-1 rounded-lg border border-gray-100 p-4">
                <DetailRow label="Código" value={<span className="font-mono">{event.id}</span>} />
                <DetailRow label="Tipo" value={<Badge variant={event.type === 'feria' ? 'gold' : 'info'}>{event.type}</Badge>} />
                <DetailRow label="Fechas" value={event.startDate === event.endDate ? event.startDate : `${event.startDate} — ${event.endDate}`} />
                <DetailRow label="Editoriales" value={extended.publishers.join(', ') || event.publisher || '—'} />
                <DetailRow label="Responsable" value={event.responsible ?? '—'} />
                <DetailRow label="Capacidad" value={extended.capacity || '—'} />
                <DetailRow
                  label="Estado"
                  value={<Badge variant="info">{eventStatusLabels[event.status]}</Badge>}
                />
                {extended.notes && <DetailRow label="Observaciones" value={extended.notes} />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventario' && (
          <EventInventoryTabContent items={extended.inventory} onChange={() => {}} readOnly />
        )}

        {activeTab === 'personal' && (
          <EventStaffTabContent
            requirements={{ ventas: 0, inventario: 0, logistica: 0, caja: 0 }}
            onRequirementChange={() => {}}
            assignment={staffAssignment}
            warnings={[]}
            generated
            confirmed
            onGenerate={() => {}}
            onConfirm={() => {}}
            readOnly
          />
        )}

        {activeTab === 'utensilios' && (
          <EventUtensilsTabContent items={extended.utensils} onChange={() => {}} readOnly />
        )}

        {activeTab === 'ventas' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Ventas asociadas al evento mediante el campo <strong>Evento Asociado</strong> del módulo Ventas (estructura preparada para integración).
            </p>
            <Table
              keyField="id"
              data={sales as (typeof sales[0] & Record<string, unknown>)[]}
              columns={[
                { key: 'id', header: 'Factura', render: (s) => <span className="font-mono text-xs">{s.id}</span> },
                { key: 'date', header: 'Fecha' },
                { key: 'customer', header: 'Cliente' },
                { key: 'total', header: 'Total', render: (s) => <span className="font-semibold text-corporate">RD${s.total.toLocaleString()}</span> },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (s) => (
                    <Badge variant={s.status === 'paid' ? 'success' : 'danger'}>
                      {s.status === 'paid' ? 'Pagada' : 'Cancelada'}
                    </Badge>
                  ),
                },
              ]}
            />
            {sales.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Sin ventas registradas para este evento</p>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <Table
            keyField="id"
            data={eventHistory as (typeof eventHistory[0] & Record<string, unknown>)[]}
            columns={[
              { key: 'date', header: 'Fecha', className: 'text-xs text-gray-500' },
              { key: 'action', header: 'Acción', render: (h) => <span className="font-medium">{h.action}</span> },
              { key: 'detail', header: 'Detalle' },
              { key: 'user', header: 'Usuario' },
            ]}
          />
        )}
      </div>
    </EventModalShell>
  )
}
