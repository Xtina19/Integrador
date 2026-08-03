import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '@/context/GlobalSearchNavigationContext'
import { TableActions } from '@/components/ui/TableActions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EventFormDialog } from '@/modules/eventos/components/EventFormDialog'
import { EventDetailDialog } from '@/modules/eventos/components/EventDetailDialog'
import { useToast } from '@/context/ToastContext'
import { eventStatusLabels } from '@/constants/stateMachines'
import type { EventStatus, LibroSysEvent } from '@/types/domain'

const API_BASE = 'http://localhost:3001/api'

type Tab = 'general'

const eventStatusVariants: Record<EventStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  scheduled: 'info',
  staff_assigned: 'neutral',
  in_progress: 'success',
  finalized: 'neutral',
}


type FormDialogState = { mode: 'create' } | { mode: 'edit'; eventId: string }

interface ApiEditorial {
  id_editorial: number
  nombre: string
}

interface ApiEvent {
  id_evento: number
  nombre: string
  tipo_evento: string
  ubicacion: string
  fecha_inicio: string
  fecha_fin: string
  capacidad_esperada: number | null
  presupuesto: number | null
  costo_actual: number | null
  disponible: number | null
  estado: string
  observacion: string | null
  fecha_registro: string
  editoriales: ApiEditorial[]
}

interface ApiEventSummary {
  eventos_activos: number
  presupuesto_total: number
  ganancia_eventos: number
}

type UiEvent = LibroSysEvent & {
  budget: number
  spent: number
  remaining: number
  publishers: string[]
}


function mapApiStatus(status: string): EventStatus {
  const normalized = status?.trim().toLowerCase()

  switch (normalized) {
    case 'planificado':
    case 'programado':
    case 'scheduled':
      return 'scheduled'

    case 'personal asignado':
    case 'staff_assigned':
      return 'staff_assigned'

    case 'en curso':
    case 'en progreso':
    case 'in_progress':
      return 'in_progress'

    case 'finalizado':
    case 'finalized':
      return 'finalized'

    default:
      return 'scheduled'
  }
}

function mapApiEvent(event: ApiEvent): UiEvent {
  const budget = Number(event.presupuesto ?? 0)
  const spent = Number(event.costo_actual ?? 0)

  return {
    id: String(event.id_evento),
    name: event.nombre,
    type: event.tipo_evento,
    location: event.ubicacion ?? 'Ubicación no especificada',
    startDate: event.fecha_inicio?.slice(0, 10) ?? '',
    endDate: event.fecha_fin?.slice(0, 10) ?? '',
    status: mapApiStatus(event.estado),
    participants: Number(event.capacidad_esperada ?? 0),
    reservations: 0,
    budget,
    spent,
    remaining: Number(event.disponible ?? budget - spent),
    publishers:
      event.editoriales?.map((editorial) => editorial.nombre) ?? [],
  } as UiEvent
}

export function Events() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess } = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null)
  const [viewEventId, setViewEventId] = useState<string | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [events, setEvents] = useState<UiEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState('')

  const [eventSummary, setEventSummary] =
    useState<ApiEventSummary>({
      eventos_activos: 0,
      presupuesto_total: 0,
      ganancia_eventos: 0,
    })

  const editEvent =
    formDialog?.mode === 'edit'
      ? events.find((event) => event.id === formDialog.eventId) ?? null
      : null

  const viewEvent =
    viewEventId
      ? events.find((event) => event.id === viewEventId) ?? null
      : null

  async function loadEventSummary() {
    try {
      const response = await fetch(
        `${API_BASE}/eventos/resumen`
      )

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(
          responseText ||
          'No se pudo cargar el resumen de eventos.'
        )
      }

      const data = JSON.parse(responseText) as ApiEventSummary

      setEventSummary({
        eventos_activos: Number(data.eventos_activos ?? 0),
        presupuesto_total: Number(data.presupuesto_total ?? 0),
        ganancia_eventos: Number(data.ganancia_eventos ?? 0),
      })
    } catch (error) {
      console.error(
        'Error cargando resumen de eventos:',
        error
      )

      setEventSummary({
        eventos_activos: 0,
        presupuesto_total: 0,
        ganancia_eventos: 0,
      })
    }
  }

  async function loadEvents() {
    setLoadingEvents(true)
    setEventsError('')

    try {
      const response = await fetch(`${API_BASE}/eventos`)
      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(responseText || `No se pudieron cargar los eventos. Código ${response.status}`)
      }

      let data: unknown

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error('El backend no devolvió un JSON válido. ' + `${responseText.slice(0, 200)}`)
      }

      if (!Array.isArray(data)) {
        throw new Error('La respuesta del backend no contiene una lista de eventos.')
      }

      setEvents((data as ApiEvent[]).map(mapApiEvent))
    } catch (error) {
      console.error('Error cargando eventos:', error)
      setEvents([])
      setEventsError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los eventos.'
      )
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    void Promise.all([
      loadEvents(),
      loadEventSummary(),
    ])
  }, [])

  useEffect(() => {
    const navState = location.state as { openNewEvent?: boolean } | null

    if (navState?.openNewEvent) {
      setFormDialog({ mode: 'create' })
      navigate('/eventos', { replace: true, state: {} })
    }
  }, [location.state, navigate])

  useGlobalSearchRecordEffect('event', {
    onHighlight: (recordId) => {
      setActiveTab('general')
      setHighlightId(recordId)
    },
  })

  useRecordHighlightScroll(highlightId)



  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
  ]

  async function handleDeleteEvent() {
    if (!deleteEventId) return

    try {
      const response = await fetch(
        `${API_BASE}/eventos/${deleteEventId}`,
        {
          method: 'DELETE',
        }
      )

      const responseText = await response.text()

      let result: { success?: boolean; error?: string } | null = null

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || responseText || 'No se pudo eliminar el evento.')
      }

      showSuccess('Evento eliminado correctamente')
      setDeleteEventId(null)
      await loadEvents()
      await loadEventSummary()
    } catch (error) {
      console.error('Error eliminando evento:', error)
      setEventsError(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el evento.'
      )
    }
  }

  return (
    <div className="space-y-6">
      {loadingEvents && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Cargando eventos...
        </div>
      )}

      {eventsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {eventsError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Eventos Activos"
          value={eventSummary.eventos_activos}
          detail="Eventos no finalizados"
          icon={<Calendar size={22} />}
        />

        <StatCard
          title="Presupuesto Total"
          value={`RD$${eventSummary.presupuesto_total.toLocaleString()}`}
          detail="Presupuesto general de eventos"
          icon={<DollarSign size={22} />}
        />

        <StatCard
          title="Ganancia Eventos"
          value={`RD$${eventSummary.ganancia_eventos.toLocaleString()}`}
          detail="Pendiente de integración con Ventas"
          icon={<TrendingUp size={22} />}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'bg-corporate text-white'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button icon={Plus} onClick={() => setFormDialog({ mode: 'create' })}>
          Nuevo Evento
        </Button>
      </div>

      {activeTab === 'general' && (
        <Card>
          <CardHeader
            title="Información general de eventos"
            subtitle="Programación y situación financiera"
          />

          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={events as (UiEvent & Record<string, unknown>)[]}
              columns={[
                {
                  key: 'name',
                  header: 'Evento',
                  render: (event) => (
                    <div>
                      <p className="font-medium text-gray-900">
                        {event.name}
                      </p>

                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={10} />
                        {event.location}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'startDate',
                  header: 'Fechas',
                  render: (event) => (
                    <span className="text-sm">
                      {event.startDate === event.endDate
                        ? String(event.startDate)
                        : `${String(event.startDate)} — ${String(event.endDate)}`}
                    </span>
                  ),
                },
                {
                  key: 'budget',
                  header: 'Presupuesto',
                  render: (event) => (
                    <span className="font-semibold text-corporate">
                      RD${Number(event.budget ?? 0).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'spent',
                  header: 'Costo actual',
                  render: (event) => (
                    <span className="font-semibold text-red-600">
                      RD${Number(event.spent ?? 0).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'remaining',
                  header: 'Disponible',
                  render: (event) => {
                    const remaining = Number(event.remaining ?? 0)

                    return (
                      <Badge variant={remaining >= 0 ? 'success' : 'warning'}>
                        RD${remaining.toLocaleString()}
                      </Badge>
                    )
                  },
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (event) => {
                    const status = event.status as EventStatus

                    return (
                      <Badge variant={eventStatusVariants[status]}>
                        {eventStatusLabels[status]}
                      </Badge>
                    )
                  },
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (event) => {
                    const currentEvent = event as unknown as UiEvent

                    return (
                      <TableActions
                        onView={() => setViewEventId(currentEvent.id)}
                        onEdit={
                          currentEvent.status !== 'finalized'
                            ? () => {
                              setViewEventId(null)
                              setFormDialog({
                                mode: 'edit',
                                eventId: currentEvent.id,
                              })
                            }
                            : undefined
                        }
                        onDelete={() => setDeleteEventId(currentEvent.id)}
                      />
                    )
                  },
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {/* {activeTab === 'presupuestos' && (
        <Card>
          <CardHeader
            title="Presupuestos por Evento"
            subtitle="Control presupuestario"
          />

          <CardBody className="!p-0">
            <Table
              keyField="eventId"
              data={eventBudgets as (EventBudgetRow & Record<string, unknown>)[]}
              columns={[
                {
                  key: 'eventName',
                  header: 'Evento',
                  render: (budget) => (
                    <span className="font-medium">
                      {String(budget.eventName)}
                    </span>
                  ),
                },
                {
                  key: 'budget',
                  header: 'Presupuesto',
                  render: (budget) => (
                    <span className="font-semibold text-corporate">
                      RD${Number(budget.budget).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'spent',
                  header: 'Gastado',
                  render: (budget) => (
                    <span>
                      RD${Number(budget.spent).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'remaining',
                  header: 'Disponible',
                  render: (budget) => {
                    const remaining = Number(budget.remaining)

                    return (
                      <Badge
                        variant={remaining > 10000 ? 'success' : 'warning'}
                      >
                        RD${remaining.toLocaleString()}
                      </Badge>
                    )
                  },
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'costos' && (
        <Card>
          <CardHeader title="Costos de Eventos" subtitle="Gastos registrados" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={eventCosts}
              columns={[
                {
                  key: 'event',
                  header: 'Evento',
                  render: (cost) => <span className="font-medium">{cost.event}</span>,
                },
                { key: 'concept', header: 'Concepto' },
                {
                  key: 'amount',
                  header: 'Monto',
                  render: (cost) => (
                    <span className="font-semibold text-corporate">
                      RD${cost.amount.toLocaleString()}
                    </span>
                  ),
                },
                { key: 'date', header: 'Fecha' },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'ingresos' && (
        <Card>
          <CardHeader title="Ingresos de Eventos" subtitle="Ventas y entradas" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={eventIncome}
              columns={[
                {
                  key: 'event',
                  header: 'Evento',
                  render: (income) => <span className="font-medium">{income.event}</span>,
                },
                { key: 'concept', header: 'Concepto' },
                {
                  key: 'amount',
                  header: 'Monto',
                  render: (income) => (
                    <span className="font-semibold text-emerald-600">
                      RD${income.amount.toLocaleString()}
                    </span>
                  ),
                },
                { key: 'date', header: 'Fecha' },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'editoriales' && (
        <Card>
          <CardHeader
            title="Editoriales Participantes"
            subtitle="Editoriales registradas por evento"
          />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={eventPublishers as (EventPublisherRow & Record<string, unknown>)[]}
              columns={[
                {
                  key: 'eventName',
                  header: 'Evento',
                  render: (publisher) => (
                    <span className="font-medium">
                      {String(publisher.eventName ?? '')}
                    </span>
                  ),
                },
                {
                  key: 'publisher',
                  header: 'Editorial',
                  render: (publisher) => (
                    <span className="font-medium">
                      {String(publisher.publisher ?? '')}
                    </span>
                  ),
                },
                {
                  key: 'stand',
                  header: 'Stand',
                  render: (publisher) => (
                    <Badge variant="gold">
                      {String(publisher.stand ?? 'Sin asignar')}
                    </Badge>
                  ),
                },
                {
                  key: 'products',
                  header: 'Productos',
                  render: (publisher) => Number(publisher.products ?? 0),
                },
              ]}
            />

            {eventPublishers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                No hay editoriales asociadas a los eventos.
              </p>
            )}
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
                  {
                    key: 'eventName',
                    header: 'Evento',
                    render: (record) => (
                      <span className="font-medium">{record.eventName}</span>
                    ),
                  },
                  {
                    key: 'employeeName',
                    header: 'Empleado',
                    render: (record) => (
                      <span className="font-medium">{record.employeeName}</span>
                    ),
                  },
                  {
                    key: 'area',
                    header: 'Área',
                    render: (record) => (
                      <Badge variant="neutral">
                        {STAFF_AREA_LABELS[record.area]}
                      </Badge>
                    ),
                  },
                  {
                    key: 'startDate',
                    header: 'Fecha',
                    render: (record) => (
                      <span className="text-sm">
                        {record.startDate === record.endDate
                          ? record.startDate
                          : `${record.startDate} — ${record.endDate}`}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (record) => (
                      <Badge variant={record.status === 'confirmed' ? 'success' : 'info'}>
                        {record.status === 'confirmed' ? 'Confirmado' : 'Propuesto'}
                      </Badge>
                    ),
                  },
                ]}
              />
            </div>
          </CardBody>
        </Card>
      )} */}

      <EventFormDialog
        open={formDialog !== null}
        onClose={() => setFormDialog(null)}
        event={editEvent}
        mode={formDialog?.mode ?? 'create'}
        onSaved={async () => {
          await Promise.all([
            loadEvents(),
            loadEventSummary(),
          ])
        }}
      />

      <EventDetailDialog
        event={viewEvent}
        open={Boolean(viewEventId && viewEvent)}
        onClose={() => setViewEventId(null)}
        onEdit={() => {
          if (!viewEvent || viewEvent.status === 'finalized') return

          setViewEventId(null)
          setFormDialog({ mode: 'edit', eventId: viewEvent.id })
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteEventId)}
        onClose={() => setDeleteEventId(null)}
        onConfirm={handleDeleteEvent}
        message="¿Está seguro de eliminar este evento?"
      />
    </div>
  )
}