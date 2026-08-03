import { useEffect, useMemo, useState } from 'react'
import { Save, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LibroSysEvent } from '@/types/domain'
import type { FormEventTab } from '@/modules/eventos/types/eventExtended'
import { EventModalShell, EventTabBar } from './EventTabBar'
import { EventDetailTabContent, type EventDetailForm } from './EventDetailTabContent'
import { EventStaffTabContent } from './EventStaffTabContent'
import type { EventStaffMember } from '@/modules/eventos/types/eventExtended'
import { EventInventoryTabContent } from './EventInventoryTabContent'
import { EventUtensilsTabContent } from './EventUtensilsTabContent'
import { EventBudgetSummary } from './EventBudgetSummary'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { validateEvent } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { isEventDetailLocked, isEventFullyLocked } from '@/modules/eventos/utils/eventFieldLock'
import type { EventInventoryItem, EventUtensil } from '@/modules/eventos/types/eventExtended'

const API_BASE = 'http://localhost:3001/api'

const FORM_TABS: { id: FormEventTab; label: string }[] = [
  { id: 'detalle', label: 'Detalle del Evento' },
  { id: 'personal', label: 'Personal' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'utensilios', label: 'Utensilios' },
  { id: 'resumen', label: 'Resumen' },
]

interface EventFormDialogProps {
  open: boolean
  onClose: () => void
  event?: LibroSysEvent | null
  mode: 'create' | 'edit'
  /** Llamar después de guardar con éxito, para que la pantalla que lista eventos pueda refrescarse */
  onSaved?: () => void
}

const emptyDetailForm = (): EventDetailForm => ({
  code: 'Se generará automáticamente',
  name: '',
  type: 'feria',
  publishers: [],
  publisherIds: [],
  location: '',
  startDate: '',
  endDate: '',
  responsible: 'Laura Méndez',
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
  const [inventory, setInventory] = useState<EventInventoryItem[]>([])
  const [utensils, setUtensils] = useState<EventUtensil[]>([])
  const [operationalCost, setOperationalCost] = useState(0)
  const [estado, setEstado] = useState('Planificado')

  useEffect(() => {
    if (!open) return

    setActiveTab('detalle')
    setError('')

    if (mode !== 'edit' || !event) {
      setDetailForm(emptyDetailForm())
      setPersonal([])
      setInventory([])
      setUtensils([])
      setOperationalCost(0)
      setEstado('Planificado')
      return
    }

    const loadEvent = async () => {
      setLoadingEvent(true)

      try {
        const response = await fetch(
          `${API_BASE}/eventos/${event.id}`
        )

        const responseText = await response.text()

        if (!response.ok) {
          throw new Error(
            responseText || 'No se pudo cargar el evento'
          )
        }

        const data = JSON.parse(responseText)

        const editoriales = Array.isArray(data.editoriales)
          ? data.editoriales
          : []

        const personalEvento = Array.isArray(data.personal)
          ? data.personal
          : []

        const inventarioEvento = Array.isArray(data.inventario)
          ? data.inventario
          : []

        const utensiliosEvento = Array.isArray(data.utensilios)
          ? data.utensilios
          : []

        setDetailForm({
          code: String(data.id_evento),
          name: data.nombre ?? '',
          type: data.tipo_evento ?? 'feria',

          publishers: editoriales.map(
            (editorial: any) => editorial.nombre
          ),

          publisherIds: editoriales.map(
            (editorial: any) => Number(editorial.id_editorial)
          ),

          location:
            data.ubicacion ??
            data.Ubicacion ??
            '',

          startDate: data.fecha_inicio?.slice(0, 10) ?? '',
          endDate: data.fecha_fin?.slice(0, 10) ?? '',

          responsible: data.responsable ?? '',

          budget: String(data.presupuesto ?? 0),

          capacity:
            data.capacidad_esperada != null
              ? String(data.capacidad_esperada)
              : '',

          notes: data.observacion ?? '',
        })

        setEstado(data.estado ?? 'Planificado')

        setPersonal(
          personalEvento.map((person: any) => ({
            id: `PE-${person.id_personal_evento}`,
            id_persona: Number(person.id_persona),
            personaNombre:
              person.nombre_persona ??
              person.nombre ??
              'Persona sin nombre',
            rol: person.rol ?? '',
            horaEntrada:
              person.hora_entrada?.slice(0, 16) ?? '',
            horaSalida:
              person.hora_salida?.slice(0, 16) ?? '',
            costo:
              person.costo != null
                ? String(person.costo)
                : '',
            observacion: person.observacion ?? '',
          }))
        )

        setInventory(
          inventarioEvento.map((item: any, index: number) => ({
            id: `EI-${item.id_producto}-${index}`,
            product: item.titulo ?? '',
            code: String(item.id_producto ?? ''),
            isbn: String(item.ISBN ?? item.isbn ?? ''),
            qty: Number(item.Cantidad ?? item.cantidad ?? 0),
            originBranch:
              item.Sucursal ??
              item.sucursal ??
              '',
          }))
        )

        setUtensils(
          utensiliosEvento.map((item: any, index: number) => ({
            id: `EU-${item.id_material}-${index}`,
            supplier:
              item.nombre_comercial ??
              item.proveedor ??
              '',
            utensil:
              item.nombre_material ??
              item.material ??
              '',
            qty: Number(
              item.CantidadUsada ??
              item.cantidad_usada ??
              0
            ),
            unitCost: Number(
              item.CostoUnitario ??
              item.costo_unitario ??
              0
            ),
            notes:
              item.Observaciones ??
              item.observaciones ??
              '',
            id_material: Number(item.id_material),
            id_proveedor: Number(item.id_proveedor),
          }))
        )

        const costoPersonal = personalEvento.reduce(
          (total: number, person: any) =>
            total + Number(person.costo ?? 0),
          0
        )

        const costoUtensilios = utensiliosEvento.reduce(
          (total: number, item: any) =>
            total +
            Number(
              item.CostoTotal ??
              item.costo_total ??
              Number(item.CantidadUsada ?? 0) *
              Number(item.CostoUnitario ?? 0)
            ),
          0
        )

        setOperationalCost(costoPersonal + costoUtensilios)
      } catch (error) {
        console.error('Error cargando el evento:', error)

        setError(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el evento'
        )
      } finally {
        setLoadingEvent(false)
      }
    }

    void loadEvent()
  }, [open, mode, event])

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
    detailForm.publisherIds.length > 0 &&
    (mode === 'edit' || personal.length > 0)

  const tabIndex = FORM_TABS.findIndex((t) => t.id === activeTab)

  function buildPayload() {
    return {
      nombre: trim(detailForm.name),
      tipo_evento: detailForm.type,
      ubicacion: trim(detailForm.location),
      fecha_inicio: detailForm.startDate,
      fecha_fin: detailForm.endDate,
      capacidad_esperada: Number(detailForm.capacity) || null,
      presupuesto: Number(detailForm.budget) || 0,
      responsable: detailForm.responsible,
      observacion: detailForm.notes || null,
      estado,
      id_editoriales: detailForm.publisherIds,
      inventario: inventory.map((i) => ({
        id_producto: Number(i.code),
        isbn: i.isbn ? String(i.isbn) : null,
        cantidad: i.qty,
        sucursal: i.originBranch || null,
      })),
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
          costo_total: u.qty * u.unitCost,
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
      const url = mode === 'edit' && event ? `${API_BASE}/eventos/${event.id}` : `${API_BASE}/eventos`
      const method = mode === 'edit' ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const result = await res.json().catch(() => null)

      console.log('Respuesta backend:', result)

      if (!res.ok || !result?.success) {
        setError(result?.error ?? 'Error al guardar el evento')
        return
      }
      showSuccess(mode === 'create' ? 'Evento registrado correctamente' : 'Evento actualizado correctamente')
      onSaved?.()
      onClose()
    } catch {
      setError('No se pudo conectar con el servidor')
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
            Este evento está finalizado. No se permiten modificaciones.
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
        {!loadingEvent && activeTab === 'inventario' && (
          <EventInventoryTabContent items={inventory} onChange={setInventory} readOnly={fullyLocked} />
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
              onOperationalCostChange={fullyLocked ? undefined : setOperationalCost}
              readOnly={fullyLocked}
            />
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Evento:</strong> {detailForm.name || '—'}</p>
              <p><strong>Editoriales:</strong> {detailForm.publishers.join(', ') || '—'}</p>
              <p><strong>Personal asignado:</strong> {personal.length}</p>
              <p><strong>Productos asignados:</strong> {inventory.length}</p>
              <p><strong>Utensilios:</strong> {utensils.length}</p>
            </div>
          </div>
        )}
      </div>
    </EventModalShell>
  )
}