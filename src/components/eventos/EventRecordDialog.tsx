import { useEffect, useState } from 'react'
import type { LibroSysEvent } from '../../types/domain'
import { FormDialog, DetailRow } from '../ui/FormDialog'
import { Input, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { eventStatusLabels } from '../../business-rules/stateMachines'
import { publisherNames } from '../../data/adminMockData'
import { useERP } from '../../store/ERPProvider'

interface EventRecordDialogProps {
  event: LibroSysEvent | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const eventStatusVariants: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  scheduled: 'info',
  staff_assigned: 'neutral',
  in_progress: 'success',
  finalized: 'neutral',
}

const eventTypeOptions = [
  { value: 'feria', label: 'Feria' },
  { value: 'evento', label: 'Evento' },
]

export function EventRecordDialog({ event, mode, open, onClose, onEdit }: EventRecordDialogProps) {
  const { updateEvent } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    type: 'evento',
    startDate: '',
    endDate: '',
    location: '',
    publisher: '',
    budget: '',
    responsible: '',
    participants: '',
    reservations: '',
  })

  useEffect(() => {
    if (!event) return
    setForm({
      name: event.name,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      publisher: event.publisher ?? '',
      budget: String(event.budget ?? 0),
      responsible: event.responsible ?? '',
      participants: String(event.participants),
      reservations: String(event.reservations),
    })
    setError('')
  }, [event, mode, open])

  if (!event) return null

  function handleSave() {
    const result = updateEvent({
      eventId: event!.id,
      name: form.name,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location,
      publisher: form.publisher,
      budget: Number(form.budget) || 0,
      responsible: form.responsible,
      participants: Number(form.participants) || 0,
      reservations: Number(form.reservations) || 0,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Detalle de Evento' : 'Editar Evento'}
      subtitle={event.name}
      mode={mode}
      onEdit={onEdit}
      onSave={handleSave}
      maxWidth="3xl"
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>
      )}

      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Código" value={<span className="font-mono">{event.id}</span>} />
          <DetailRow label="Nombre" value={event.name} />
          <DetailRow label="Tipo" value={<Badge variant={event.type === 'feria' ? 'gold' : 'info'}>{event.type === 'feria' ? 'Feria' : 'Evento'}</Badge>} />
          <DetailRow label="Ubicación" value={event.location} />
          <DetailRow label="Fechas" value={event.startDate === event.endDate ? event.startDate : `${event.startDate} — ${event.endDate}`} />
          <DetailRow label="Editorial" value={event.publisher ?? '—'} />
          <DetailRow label="Presupuesto" value={`RD$${(event.budget ?? 0).toLocaleString()}`} />
          <DetailRow label="Responsable" value={event.responsible ?? '—'} />
          <DetailRow label="Participantes" value={event.participants} />
          <DetailRow label="Reservaciones" value={event.reservations} />
          <DetailRow
            label="Estado"
            value={
              <Badge variant={eventStatusVariants[event.status]}>
                {eventStatusLabels[event.status]}
              </Badge>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Código" value={event.id} disabled />
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <Select label="Tipo *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={eventTypeOptions} />
          <Input label="Ubicación *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Fecha inicio *" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="Fecha fin *" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Select label="Editorial" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} options={publisherNames.map((p) => ({ value: p, label: p }))} />
          <Input label="Presupuesto" type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <Input label="Responsable" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <Input label="Participantes" type="number" min={0} value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} />
          <Input label="Reservaciones" type="number" min={0} value={form.reservations} onChange={(e) => setForm({ ...form, reservations: e.target.value })} />
        </div>
      )}
    </FormDialog>
  )
}
