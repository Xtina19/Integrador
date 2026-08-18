import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, ShoppingCart } from 'lucide-react'
import type { LibroSysEvent } from '@/types/domain'
import type { DetailEventTab, EventExtendedData } from '@/modules/eventos/types/eventExtended'
import { EventModalShell, EventTabBar } from './EventTabBar'
import { EventDashboardCards } from './EventDashboardCards'
import { EventBudgetSummary } from './EventBudgetSummary'
import { EventInventoryTabContent } from './EventInventoryTabContent'
import { EventUtensilsTabContent } from './EventUtensilsTabContent'
import { EventStaffTabContent } from './EventStaffTabContent'
import { DetailRow } from '@/components/ui/FormDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { eventStatusLabels } from '@/constants/stateMachines'
import { isEventEditable } from '@/modules/eventos/utils/eventFieldLock'
import {
  costoPersonalEvento,
  eventosApi,
  mapInventarioSucursal,
  mapPersonalEvento,
  mapUtensiliosEvento,
} from '@/modules/eventos/services/eventosApi'

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

function emptyExtended(eventId: string): EventExtendedData {
  return {
    eventId,
    publishers: [],
    capacity: 0,
    inventory: [],
    utensils: [],
    staff: [],
    operationalCost: 0,
    notes: '',
  }
}

export function EventDetailDialog({ event, open, onClose, onEdit }: EventDetailDialogProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DetailEventTab>('resumen')
  const [extended, setExtended] = useState<EventExtendedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const puedeFacturar =
    Boolean(event) && event!.status !== 'finalized' && event!.status !== 'cancelled'

  function irAFacturarEvento() {
    if (!event) return
    onClose()
    navigate(
      `/ventas/pos?tipoFactura=factura_evento&eventoId=${encodeURIComponent(event.id)}`,
    )
  }

  useEffect(() => {
    if (!open || !event) {
      setExtended(null)
      setError('')
      setActiveTab('resumen')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    void eventosApi.getEvent(event.id)
      .then((data) => {
        if (cancelled) return
        setExtended({
          eventId: String(data.id_evento),
          publishers: (data.editoriales ?? []).map((e) => e.nombre),
          capacity: Number(data.capacidad_esperada ?? 0),
          inventory: mapInventarioSucursal(data.inventario),
          utensils: mapUtensiliosEvento(data.utensilios),
          staff: mapPersonalEvento(data.personal),
          operationalCost: costoPersonalEvento(data.personal),
          notes: data.observacion ?? '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        setExtended(emptyExtended(event.id))
        setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle del evento.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, event])

  if (!event) return null

  const data = extended ?? emptyExtended(event.id)
  const staffCount = data.staff.length || event.participants || 0
  const canEdit = isEventEditable(event.status)

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
          {puedeFacturar && (
            <Button variant="primary" icon={ShoppingCart} onClick={irAFacturarEvento}>
              Facturar evento
            </Button>
          )}
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

        {loading && (
          <div className="text-sm text-gray-500">Cargando detalle del evento...</div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</div>
        )}

        {activeTab === 'resumen' && !loading && (
          <div className="space-y-6">
            <EventDashboardCards
              event={event}
              extended={data}
              salesTotal={0}
              staffCount={staffCount}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EventBudgetSummary
                budget={event.budget ?? 0}
                utensils={data.utensils}
                operationalCost={data.operationalCost}
                readOnly
              />
              <div className="space-y-1 rounded-lg border border-gray-100 p-4">
                <DetailRow label="Código" value={<span className="font-mono">{event.id}</span>} />
                <DetailRow label="Tipo" value={<Badge variant="info">{event.type}</Badge>} />
                <DetailRow label="Fechas" value={event.startDate === event.endDate ? event.startDate : `${event.startDate} — ${event.endDate}`} />
                <DetailRow label="Editoriales" value={data.publishers.join(', ') || event.publisher || '—'} />
                <DetailRow label="Responsable" value={event.responsible ?? '—'} />
                <DetailRow label="Capacidad" value={data.capacity || '—'} />
                <DetailRow
                  label="Estado"
                  value={<Badge variant="info">{eventStatusLabels[event.status]}</Badge>}
                />
                {data.notes && <DetailRow label="Observaciones" value={data.notes} />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventario' && !loading && (
          <EventInventoryTabContent items={data.inventory} onChange={() => {}} readOnly />
        )}

        {activeTab === 'personal' && !loading && (
          <EventStaffTabContent items={data.staff} onChange={() => {}} readOnly />
        )}

        {activeTab === 'utensilios' && !loading && (
          <EventUtensilsTabContent items={data.utensils} onChange={() => {}} readOnly />
        )}

        {activeTab === 'ventas' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm text-gray-600">
              Facture ventas asociadas a este evento desde el POS. El tipo de factura quedará como
              «Factura de evento» y el evento quedará vinculado en la factura.
            </p>
            <Button
              type="button"
              variant="primary"
              icon={ShoppingCart}
              disabled={!puedeFacturar}
              onClick={irAFacturarEvento}
            >
              Facturar evento
            </Button>
            {!puedeFacturar && (
              <p className="text-xs text-gray-400">
                Solo se puede facturar eventos activos (no finalizados ni cancelados).
              </p>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <p className="text-sm text-gray-500 text-center py-8">
            El historial de eventos no está registrado en la base de datos.
          </p>
        )}
      </div>
    </EventModalShell>
  )
}
