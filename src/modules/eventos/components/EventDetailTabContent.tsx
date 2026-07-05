import { useState } from 'react'
import { X } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { publisherNames } from '@/mocks/mockAdmin'
import { isEventDetailLocked } from '@/modules/eventos/utils/eventFieldLock'
import type { EventStatus } from '@/types/domain'

export interface EventDetailForm {
  code: string
  name: string
  type: string
  publishers: string[]
  location: string
  startDate: string
  endDate: string
  responsible: string
  budget: string
  capacity: string
  notes: string
}

const eventTypes = [
  { value: 'feria', label: 'Feria' },
  { value: 'evento', label: 'Evento' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'taller', label: 'Taller' },
]

const responsables = [
  'Laura Méndez',
  'Carlos Ruiz',
  'Ana Martínez',
  'Luis Hernández',
  'Roberto Sánchez',
]

interface EventDetailTabContentProps {
  form: EventDetailForm
  onChange: (form: EventDetailForm) => void
  status?: EventStatus
  locked?: boolean
}

export function EventDetailTabContent({ form, onChange, status, locked }: EventDetailTabContentProps) {
  const fieldsLocked = locked ?? (status ? isEventDetailLocked(status) || status === 'finalized' : false)
  const [publisherPick, setPublisherPick] = useState('')

  function update(field: keyof EventDetailForm, value: string | string[]) {
    onChange({ ...form, [field]: value })
  }

  function addPublisher() {
    if (!publisherPick || form.publishers.includes(publisherPick)) return
    update('publishers', [...form.publishers, publisherPick])
    setPublisherPick('')
  }

  function removePublisher(name: string) {
    update(
      'publishers',
      form.publishers.filter((p) => p !== name)
    )
  }

  return (
    <div className="space-y-6">
      {fieldsLocked && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
          Este evento está en curso. Los datos principales están bloqueados. Puede editar utensilios, observaciones e inventario adicional.
        </div>
      )}
      {status === 'finalized' && (
        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          Este evento está finalizado. Todos los campos están en solo lectura.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Código del evento" value={form.code} disabled className="bg-gray-50" />
        <Select
          label="Tipo de evento *"
          value={form.type}
          disabled={fieldsLocked}
          onChange={(e) => update('type', e.target.value)}
          options={eventTypes}
        />
        <Input
          label="Nombre *"
          value={form.name}
          disabled={fieldsLocked}
          onChange={(e) => update('name', e.target.value)}
          className="md:col-span-2"
        />
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Editorial(es) *</label>
          {!fieldsLocked && (
            <div className="flex gap-2">
              <Select
                value={publisherPick}
                onChange={(e) => setPublisherPick(e.target.value)}
                options={[
                  { value: '', label: 'Seleccione editorial...' },
                  ...publisherNames.map((p) => ({ value: p, label: p })),
                ]}
                className="flex-1"
              />
              <button
                type="button"
                onClick={addPublisher}
                disabled={!publisherPick}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-corporate text-white hover:bg-corporate/90 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {form.publishers.length === 0 && (
              <span className="text-sm text-gray-400">Sin editoriales seleccionadas</span>
            )}
            {form.publishers.map((p) => (
              <span key={p} className="inline-flex items-center gap-1">
                <Badge variant="gold">{p}</Badge>
                {!fieldsLocked && (
                  <button type="button" onClick={() => removePublisher(p)} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
        <Input
          label="Lugar *"
          value={form.location}
          disabled={fieldsLocked}
          onChange={(e) => update('location', e.target.value)}
        />
        <Input
          label="Capacidad estimada"
          type="number"
          min={0}
          value={form.capacity}
          disabled={fieldsLocked}
          onChange={(e) => update('capacity', e.target.value)}
        />
        <Input
          label="Fecha inicio *"
          type="date"
          value={form.startDate}
          disabled={fieldsLocked}
          onChange={(e) => update('startDate', e.target.value)}
        />
        <Input
          label="Fecha fin *"
          type="date"
          value={form.endDate}
          disabled={fieldsLocked}
          onChange={(e) => update('endDate', e.target.value)}
        />
        <Select
          label="Responsable *"
          value={form.responsible}
          disabled={fieldsLocked}
          onChange={(e) => update('responsible', e.target.value)}
          options={responsables.map((r) => ({ value: r, label: r }))}
        />
        <Input
          label="Presupuesto asignado *"
          type="number"
          min={0}
          value={form.budget}
          disabled={fieldsLocked}
          onChange={(e) => update('budget', e.target.value)}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20 disabled:bg-gray-50 disabled:text-gray-500"
            rows={3}
            value={form.notes}
            disabled={status === 'finalized'}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Notas internas del evento..."
          />
        </div>
      </div>
    </div>
  )
}
