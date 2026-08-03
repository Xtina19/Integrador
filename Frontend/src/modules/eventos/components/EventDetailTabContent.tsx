import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { isEventDetailLocked } from '@/modules/eventos/utils/eventFieldLock'
import type { EventStatus } from '@/types/domain'
import { fetchArray } from '../utils/apiLists'

const API_BASE = 'http://localhost:3001/api'

export interface EventDetailForm {
  code: string
  name: string
  type: string
  publishers: string[]       // guardamos nombres para mostrar en los badges
  publisherIds: number[]     // y los IDs reales, que son los que se envían al backend
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

interface EventDetailTabContentProps {
  form: EventDetailForm
  onChange: (form: EventDetailForm) => void
  status?: EventStatus
  locked?: boolean
}

interface EditorialOption {
  id_editorial: number
  nombre: string
}

interface PersonaOption {
  id_persona: number
  tipo_persona: string
  nombre: string
}

export function EventDetailTabContent({ form, onChange, status, locked }: EventDetailTabContentProps) {
  const fieldsLocked = locked ?? (status ? isEventDetailLocked(status) || status === 'finalized' : false)
  const [publisherPick, setPublisherPick] = useState('')
  const [editoriales, setEditoriales] = useState<EditorialOption[]>([])
  const [loadingEditoriales, setLoadingEditoriales] = useState(true)
  const [responsables, setResponsables] = useState<PersonaOption[]>([])
  const [loadingResponsables, setLoadingResponsables] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    async function loadCatalogs() {
      setLoadingEditoriales(true)
      setLoadingResponsables(true)
      setCatalogError('')

      try {
        const [editorialesData, responsablesData] = await Promise.all([
          fetchArray<EditorialOption>(
            `${API_BASE}/eventos/editoriales`
          ),
          fetchArray<PersonaOption>(
            `${API_BASE}/eventos/personas`
          ),
        ])

        setEditoriales(editorialesData)
        setResponsables(responsablesData)
      } catch (error) {
        console.error(
          'Error cargando los catálogos del evento:',
          error
        )

        setEditoriales([])
        setResponsables([])
        setCatalogError(
          'No se pudieron cargar las editoriales y los responsables.'
        )
      } finally {
        setLoadingEditoriales(false)
        setLoadingResponsables(false)
      }
    }

    void loadCatalogs()
  }, [])

  function update(field: keyof EventDetailForm, value: string | string[] | number[]) {
    onChange({ ...form, [field]: value })
  }

  function addPublisher() {
    if (!publisherPick) return
    const id = Number(publisherPick)
    if (form.publisherIds.includes(id)) return
    const nombre = editoriales.find((e) => e.id_editorial === id)?.nombre ?? publisherPick
    onChange({
      ...form,
      publisherIds: [...form.publisherIds, id],
      publishers: [...form.publishers, nombre],
    })
    setPublisherPick('')
  }

  function removePublisher(id: number) {
    const idx = form.publisherIds.indexOf(id)
    if (idx === -1) return
    onChange({
      ...form,
      publisherIds: form.publisherIds.filter((_, i) => i !== idx),
      publishers: form.publishers.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-6">
      {catalogError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {catalogError}
        </div>
      )}
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
                disabled={loadingEditoriales}
                options={[
                  { value: '', label: loadingEditoriales ? 'Cargando editoriales...' : 'Seleccione editorial...' },
                  ...editoriales.map((e) => ({ value: String(e.id_editorial), label: e.nombre })),
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
            {form.publisherIds.length === 0 && (
              <span className="text-sm text-gray-400">Sin editoriales seleccionadas</span>
            )}
            {form.publisherIds.map((id, i) => (
              <span key={id} className="inline-flex items-center gap-1">
                <Badge variant="gold">{form.publishers[i]}</Badge>
                {!fieldsLocked && (
                  <button type="button" onClick={() => removePublisher(id)} className="text-gray-400 hover:text-red-500">
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
          disabled={fieldsLocked || loadingResponsables}
          onChange={(e) =>
            update('responsible', e.target.value)
          }
          options={[
            {
              value: '',
              label: loadingResponsables
                ? 'Cargando responsables...'
                : 'Seleccione responsable...',
            },
            ...responsables.map((persona) => ({
              value: persona.nombre,
              label: persona.nombre,
            })),
          ]}
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