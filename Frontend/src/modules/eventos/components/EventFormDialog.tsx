import { useEffect, useMemo, useState } from 'react'
import { Save, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LibroSysEvent } from '@/types/domain'
import type { FormEventTab } from '@/modules/eventos/types/eventExtended'
import { EventModalShell, EventTabBar } from './EventTabBar'
import { EventDetailTabContent, type EventDetailForm } from './EventDetailTabContent'
import { EventStaffTabContent } from './EventStaffTabContent'
import type { EventStaffMember } from '@/modules/eventos/types/eventExtended'
import { EventUtensilsTabContent } from './EventUtensilsTabContent'
import { EventBudgetSummary } from './EventBudgetSummary'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { validateEvent } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { isEventDetailLocked, isEventFullyLocked } from '@/modules/eventos/utils/eventFieldLock'
import type { EventUtensil } from '@/modules/eventos/types/eventExtended'
import {
  eventosApi,
  mapPersonalEvento,
  mapUtensiliosEvento,
} from '@/modules/eventos/services/eventosApi'

const FORM_TABS: { id: FormEventTab; label: string }[] = [
  { id: 'detalle', label: 'Detalle del Evento' },
  { id: 'personal', label: 'Personal' },
  { id: 'utensilios', label: 'Utensilios' },
  { id: 'resumen', label: 'Resumen' },
]

interface EventFormDialogProps {
  open: boolean
  onClose: () => void
  event?: LibroSysEvent | null
  mode: 'create' | 'edit'
  onSaved?: () => void
}

const emptyDetailForm = (): EventDetailForm => ({
  code: 'Se generará automáticamente',
  name: '',
  type: 'Feria del libro',
  publishers: [],
  publisherIds: [],
  location: '',
  sucursalId: '',
  startDate: '',
  endDate: '',
  responsible: '',
  responsibleId: '',
  budget: '',
  capacity: '',
  notes: '',
})

export function EventFormDialog({ open, onClose, event, mode, onSaved }: EventFormDialogProps) {
  const { showSuccess } = useToast()

  const [activeTab, setActiveTab] = useState<FormEventTab>('detalle')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(false)

  const [detailForm, setDetailForm] = useState<EventDetailForm>(emptyDetailForm())
  const [personal, setPersonal] = useState<EventStaffMember[]>([])
  const [utensils, setUtensils] = useState<EventUtensil[]>([])
  const [estado, setEstado] = useState('Planificado')

  useEffect(() => {
    if (!open) return

    setActiveTab('detalle')
    setError('')

    if (mode !== 'edit' || !event) {
      setDetailForm(emptyDetailForm())
      setPersonal([])
      setUtensils([])
      setEstado('Planificado')
      return
    }

    const loadEvent = async () => {
      setLoadingEvent(true)

      try {
        const data = await eventosApi.getEvent(event.id)
        const editoriales = Array.isArray(data.editoriales) ? data.editoriales : []
        const personalEvento = mapPersonalEvento(data.personal)
        const utensiliosEvento = mapUtensiliosEvento(data.utensilios)

        setDetailForm({
          code: String(data.id_evento),
          name: data.nombre ?? '',
          type: data.tipo_evento ?? 'Feria del libro',
          publishers: editoriales.map((editorial) => editorial.nombre),
          publisherIds: editoriales.map((editorial) => Number(editorial.id_editorial)),
          location: data.ubicacion ?? '',
          sucursalId: data.id_sucursal ?? '',
          startDate: data.fecha_inicio?.slice(0, 10) ?? '',
          endDate: data.fecha_fin?.slice(0, 10) ?? '',
          responsible: data.responsable ?? '',
          responsibleId: data.id_persona_responsable ?? '',
          budget: String(data.presupuesto ?? 0),
          capacity: data.capacidad_esperada != null ? String(data.capacidad_esperada) : '',
          notes: data.observacion ?? '',
        })

        setEstado(data.estado ?? 'Planificado')
        setPersonal(personalEvento)
        setUtensils(utensiliosEvento)
      } catch (err) {
        console.error('Error cargando el evento:', err)
        setError(err instanceof Error ? err.message : 'No se pudo cargar el evento')
      } finally {
        setLoadingEvent(false)
      }
    }

    void loadEvent()
  }, [open, mode, event])

  const operationalCost = personal.reduce((total, person) => total + Number(person.costo || 0), 0)
  const fullyLocked = event ? isEventFullyLocked(event.status) : false
  const detailReadOnly = fullyLocked || (mode === 'edit' && event ? isEventDetailLocked(event.status) : false)

  const validation = useMemo(
    () =>
      validateEvent({
        name: detailForm.name,
        type: detailForm.type,
        startDate: detailForm.startDate,
        endDate: detailForm.endDate,
        location: detailForm.location,
        publisher: detailForm.publishers[0] ?? '',
        budget: detailForm.budget,
        responsible: detailForm.responsible,
      }),
    [detailForm]
  )

  const canSave =
    !fullyLocked &&
    validation.valid &&
    detailForm.sucursalId !== '' &&
    detailForm.responsibleId !== '' &&
    detailForm.publisherIds.length > 0

  const tabIndex = FORM_TABS.findIndex((t) => t.id === activeTab)

  function buildPayload() {
    return {
      nombre: trim(detailForm.name),
      tipo_evento: detailForm.type,
      id_sucursal: Number(detailForm.sucursalId),
      fecha_inicio: detailForm.startDate,
      fecha_fin: detailForm.endDate,
      capacidad_esperada: Number(detailForm.capacity) || null,
      presupuesto: Number(detailForm.budget) || 0,
      id_persona_responsable: detailForm.responsibleId || null,
      observacion: detailForm.notes || null,
      estado,
      id_editoriales: detailForm.publisherIds,
      personal: personal.map((p) => ({
        id_persona: p.id_persona,
        rol: p.rol,
        hora_entrada: p.horaEntrada || null,
        hora_salida: p.horaSalida || null,
        costo: p.costo ? Number(p.costo) : null,
        observacion: p.observacion || null,
        estado: 'Confirmado',
      })),
      utensilios: utensils.map((u) => {
        const anyU = u as EventUtensil & { id_material?: number; id_proveedor?: number }
        return {
          id_material: anyU.id_material,
          id_proveedor: anyU.id_proveedor,
          cantidad_usada: u.qty,
          costo_unitario: u.unitCost,
          observaciones: u.notes || null,
        }
      }),
    }
  }

  async function handleSave() {
    if (!canSave) {
      setError(validation.errors[0] ?? 'Complete todos los campos obligatorios.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await eventosApi.saveEvent(buildPayload(), mode === 'edit' && event ? event.id : undefined)
      showSuccess(mode === 'create' ? 'Evento registrado correctamente' : 'Evento actualizado correctamente')
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar con el servidor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <EventModalShell
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Evento' : 'Editar Evento'}
      subtitle={mode === 'edit' && event ? String(event.id) : 'Complete las pestañas para registrar el evento'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          {tabIndex > 0 && (
            <Button variant="outline" icon={ChevronLeft} onClick={() => setActiveTab(FORM_TABS[tabIndex - 1].id)} disabled={saving}>
              Anterior
            </Button>
          )}
          {tabIndex < FORM_TABS.length - 1 && (
            <Button variant="outline" icon={ChevronRight} onClick={() => setActiveTab(FORM_TABS[tabIndex + 1].id)} disabled={saving}>
              Siguiente
            </Button>
          )}
          <Button icon={Save} onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Guardando...' : mode === 'create' ? 'Confirmar Evento' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <EventTabBar tabs={FORM_TABS} active={activeTab} onChange={setActiveTab} />
        {loadingEvent && (
          <div className="text-sm text-gray-500">Cargando evento...</div>
        )}
        {fullyLocked && (
          <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
            Este evento está {event?.status === 'cancelled' ? 'cancelado' : 'finalizado'}. No se permiten modificaciones.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</div>
        )}

        {!loadingEvent && activeTab === 'detalle' && (
          <EventDetailTabContent
            form={detailForm}
            onChange={setDetailForm}
            status={event?.status}
            locked={detailReadOnly}
          />
        )}
        {!loadingEvent && activeTab === 'personal' && (
          <EventStaffTabContent items={personal} onChange={setPersonal} readOnly={fullyLocked} />
        )}
        {!loadingEvent && activeTab === 'utensilios' && (
          <EventUtensilsTabContent items={utensils} onChange={setUtensils} readOnly={fullyLocked} />
        )}
        {!loadingEvent && activeTab === 'resumen' && (
          <div className="space-y-6">
            <EventBudgetSummary
              budget={Number(detailForm.budget) || 0}
              utensils={utensils}
              operationalCost={operationalCost}
              readOnly={fullyLocked}
            />
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Evento:</strong> {detailForm.name || '—'}</p>
              <p><strong>Sucursal:</strong> {detailForm.location || '—'}</p>
              <p><strong>Editoriales:</strong> {detailForm.publishers.join(', ') || '—'}</p>
              <p><strong>Personal asignado:</strong> {personal.length}</p>
              <p><strong>Utensilios:</strong> {utensils.length}</p>
            </div>
          </div>
        )}
      </div>
    </EventModalShell>
  )
}
