import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Users, Ticket } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { Toolbar } from '../components/ui/Toolbar'
import { calendarEvents } from '../data/mockData'
import { useERP } from '../store/ERPProvider'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '../context/GlobalSearchNavigationContext'
import { TableActions } from '../components/ui/TableActions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EventRecordDialog } from '../components/eventos/EventRecordDialog'
import { useToast } from '../context/ToastContext'
import { eventBudgets, eventCosts, eventIncome, eventPublishers } from '../data/eventsMockData'
import { useStaffAssignment } from '../context/StaffAssignmentContext'
import { STAFF_AREA_LABELS, type StaffAssignmentRecord } from '../types/staffAssignment'

import { eventStatusLabels } from '../business-rules/stateMachines'
import type { EventStatus, LibroSysEvent } from '../types/domain'

type Tab = 'calendario' | 'presupuestos' | 'costos' | 'ingresos' | 'editoriales' | 'asignaciones'

const eventStatusVariants: Record<EventStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  scheduled: 'info',
  staff_assigned: 'neutral',
  in_progress: 'success',
  finalized: 'neutral',
}

const eventType: Record<string, { label: string; variant: 'gold' | 'info' }> = {
  feria: { label: 'Feria', variant: 'gold' },
  evento: { label: 'Evento', variant: 'info' },
}

const daysInMonth = 30
const firstDayOffset = 6

export function Events() {
  const navigate = useNavigate()
  const { history } = useStaffAssignment()
  const { state, deleteEvent } = useERP()
  const { showSuccess } = useToast()
  const events = state.events
  const [activeTab, setActiveTab] = useState<Tab>('calendario')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [eventDialog, setEventDialog] = useState<{ eventId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  const selectedEvent = eventDialog ? events.find((e) => e.id === eventDialog.eventId) ?? null : null

  useGlobalSearchRecordEffect('event', {
    onHighlight: (recordId) => {
      setActiveTab('calendario')
      setHighlightId(recordId)
    },
  })
  useRecordHighlightScroll(highlightId)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const filteredAssignments = useMemo(() => {
    if (!assignmentSearch) return history
    const q = assignmentSearch.toLowerCase()
    return history.filter(
      (r) =>
        r.eventName.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        STAFF_AREA_LABELS[r.area].toLowerCase().includes(q)
    )
  }, [history, assignmentSearch])
  const activeEvents = events.filter((e) => e.status === 'in_progress').length
  const totalReservations = events.reduce((sum, e) => sum + e.reservations, 0)
  const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'calendario', label: 'Calendario' },
    { id: 'presupuestos', label: 'Presupuestos' },
    { id: 'costos', label: 'Costos' },
    { id: 'ingresos', label: 'Ingresos' },
    { id: 'editoriales', label: 'Editoriales' },
    { id: 'asignaciones', label: 'Asignaciones de Personal' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Eventos Activos"
          value={activeEvents}
          detail={`${events.length} programados`}
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="Reservaciones"
          value={totalReservations}
          detail="Total acumulado"
          icon={<Ticket size={22} />}
        />
        <StatCard
          title="Participantes"
          value={totalParticipants}
          detail="Personal asignado"
          icon={<Users size={22} />}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button icon={Plus} onClick={() => navigate('/eventos/nuevo')}>Nuevo Evento</Button>
      </div>

      {activeTab === 'calendario' && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader title="Calendario" subtitle="Junio 2026" />
          <CardBody>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <span key={d} className="font-semibold text-gray-400 py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const calEvent = calendarEvents.find((e) => e.day === day)
                return (
                  <div
                    key={day}
                    className={`relative flex items-center justify-center h-9 rounded-lg text-xs font-medium transition-colors ${
                      calEvent
                        ? calEvent.type === 'feria'
                          ? 'bg-gold/20 text-corporate font-bold'
                          : 'bg-corporate/10 text-corporate'
                        : 'text-gray-600 hover:bg-gray-50'
                    } ${day === 6 ? 'ring-2 ring-corporate ring-offset-1' : ''}`}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gold/30" />
                <span>Feria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-corporate/10" />
                <span>Evento</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Eventos y Ferias" subtitle="Programación actual" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={events as (LibroSysEvent & Record<string, unknown>)[]}
              columns={[
                {
                  key: 'name',
                  header: 'Nombre',
                  render: (e) => (
                    <div>
                      <p className="font-medium text-gray-900">{e.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {e.location}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  header: 'Tipo',
                  render: (e) => {
                    const t = eventType[e.type]
                    return <Badge variant={t.variant}>{t.label}</Badge>
                  },
                },
                {
                  key: 'startDate',
                  header: 'Fechas',
                  render: (e) => (
                    <span className="text-sm">
                      {e.startDate === e.endDate ? e.startDate : `${e.startDate} — ${e.endDate}`}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (e) => {
                    const st = e.status as EventStatus
                    return <Badge variant={eventStatusVariants[st]}>{eventStatusLabels[st]}</Badge>
                  },
                },
                {
                  key: 'participants',
                  header: 'Participantes',
                  render: (e) => (
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span>{e.participants}</span>
                    </div>
                  ),
                },
                {
                  key: 'reservations',
                  header: 'Reservaciones',
                  render: (e) => <span className="font-semibold text-corporate">{e.reservations}</span>,
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (e) => (
                    <TableActions
                      onView={() => setEventDialog({ eventId: e.id, mode: 'view' })}
                      onEdit={() => setEventDialog({ eventId: e.id, mode: 'edit' })}
                      onDelete={() => setDeleteEventId(e.id)}
                    />
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Reservaciones Recientes" subtitle="Últimas inscripciones a eventos" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events
              .filter((e) => e.reservations > 0)
              .map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 rounded-lg bg-surface">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{e.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.startDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-corporate">{e.reservations}</p>
                    <p className="text-xs text-gold-dark">reservaciones</p>
                  </div>
                </div>
              ))}
          </div>
        </CardBody>
      </Card>
      </>
      )}

      {activeTab === 'presupuestos' && (
        <Card>
          <CardHeader title="Presupuestos por Evento" subtitle="Control presupuestario" />
          <CardBody className="!p-0">
            <Table
              keyField="eventId"
              data={eventBudgets}
              columns={[
                { key: 'eventName', header: 'Evento', render: (b) => <span className="font-medium">{b.eventName}</span> },
                { key: 'budget', header: 'Presupuesto', render: (b) => <span className="font-semibold text-corporate">RD${b.budget.toLocaleString()}</span> },
                { key: 'spent', header: 'Gastado', render: (b) => <span>RD${b.spent.toLocaleString()}</span> },
                { key: 'remaining', header: 'Disponible', render: (b) => <Badge variant={b.remaining > 10000 ? 'success' : 'warning'}>RD${b.remaining.toLocaleString()}</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'costos' && (
        <Card>
          <CardHeader title="Costos de Eventos" subtitle="Gastos registrados" />
          <CardBody className="!p-0">
            <Table keyField="id" data={eventCosts} columns={[
              { key: 'event', header: 'Evento', render: (c) => <span className="font-medium">{c.event}</span> },
              { key: 'concept', header: 'Concepto' },
              { key: 'amount', header: 'Monto', render: (c) => <span className="font-semibold text-corporate">RD${c.amount.toLocaleString()}</span> },
              { key: 'date', header: 'Fecha' },
            ]} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'ingresos' && (
        <Card>
          <CardHeader title="Ingresos de Eventos" subtitle="Ventas y entradas" />
          <CardBody className="!p-0">
            <Table keyField="id" data={eventIncome} columns={[
              { key: 'event', header: 'Evento', render: (i) => <span className="font-medium">{i.event}</span> },
              { key: 'concept', header: 'Concepto' },
              { key: 'amount', header: 'Monto', render: (i) => <span className="font-semibold text-emerald-600">RD${i.amount.toLocaleString()}</span> },
              { key: 'date', header: 'Fecha' },
            ]} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'editoriales' && (
        <Card>
          <CardHeader title="Editoriales Participantes" subtitle="Stands y productos por feria" />
          <CardBody className="!p-0">
            <Table keyField="eventId" data={eventPublishers} columns={[
              { key: 'eventName', header: 'Evento' },
              { key: 'publisher', header: 'Editorial', render: (p) => <span className="font-medium">{p.publisher}</span> },
              { key: 'stand', header: 'Stand', render: (p) => <Badge variant="gold">{p.stand}</Badge> },
              { key: 'products', header: 'Productos' },
            ]} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'asignaciones' && (
        <Card>
          <CardHeader
            title="Asignaciones de Personal"
            subtitle={`${history.length} registros en el historial de rotación`}
          />
          <CardBody className="space-y-4">
            <Toolbar
              search={assignmentSearch}
              onSearchChange={setAssignmentSearch}
              searchPlaceholder="Buscar por evento, empleado o área..."
            />
            <div className="!p-0 border border-gray-100 rounded-lg overflow-hidden">
              <Table
                keyField="id"
                data={filteredAssignments as (StaffAssignmentRecord & Record<string, unknown>)[]}
                columns={[
                  { key: 'eventName', header: 'Evento', render: (r) => <span className="font-medium">{r.eventName}</span> },
                  { key: 'employeeName', header: 'Empleado', render: (r) => <span className="font-medium">{r.employeeName}</span> },
                  {
                    key: 'area',
                    header: 'Área',
                    render: (r) => <Badge variant="neutral">{STAFF_AREA_LABELS[r.area]}</Badge>,
                  },
                  {
                    key: 'startDate',
                    header: 'Fecha',
                    render: (r) => (
                      <span className="text-sm">
                        {r.startDate === r.endDate ? r.startDate : `${r.startDate} — ${r.endDate}`}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (r) => (
                      <Badge variant={r.status === 'confirmed' ? 'success' : 'info'}>
                        {r.status === 'confirmed' ? 'Confirmado' : 'Propuesto'}
                      </Badge>
                    ),
                  },
                ]}
              />
            </div>
          </CardBody>
        </Card>
      )}

      <EventRecordDialog
        event={selectedEvent}
        mode={eventDialog?.mode ?? 'view'}
        open={Boolean(eventDialog && selectedEvent)}
        onClose={() => setEventDialog(null)}
        onEdit={() => setEventDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
      />

      <ConfirmDialog
        open={Boolean(deleteEventId)}
        onClose={() => setDeleteEventId(null)}
        onConfirm={() => {
          if (!deleteEventId) return
          const result = deleteEvent(deleteEventId)
          if (result.success) showSuccess('Evento eliminado correctamente')
          setDeleteEventId(null)
        }}
        message="¿Está seguro de eliminar este evento?"
      />
    </div>
  )
}
