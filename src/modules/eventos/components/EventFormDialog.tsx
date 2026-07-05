import { useEffect, useMemo, useState } from 'react'
import { Save, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LibroSysEvent } from '@/types/domain'
import type { FormEventTab } from '@/modules/eventos/types/eventExtended'
import type { StaffAssignmentResult, StaffRequirements } from '@/types/staffAssignment'
import { EventModalShell, EventTabBar } from './EventTabBar'
import { EventDetailTabContent, type EventDetailForm } from './EventDetailTabContent'
import { EventStaffTabContent } from './EventStaffTabContent'
import { EventInventoryTabContent } from './EventInventoryTabContent'
import { EventUtensilsTabContent } from './EventUtensilsTabContent'
import { EventBudgetSummary } from './EventBudgetSummary'
import { Button } from '@/components/ui/Button'
import { useStaffAssignment, nextEventId } from '@/context/StaffAssignmentContext'
import { useEventExtended } from '@/context/EventExtendedContext'
import { useERP } from '@/store/ERPProvider'
import { useToast } from '@/context/ToastContext'
import { hasAssignments } from '@/lib/staffAssignmentEngine'
import { validateEvent } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { isEventDetailLocked, isEventFullyLocked } from '@/modules/eventos/utils/eventFieldLock'
import type { StaffAssignmentRecord } from '@/types/staffAssignment'
import { publisherNames } from '@/mocks/mockAdmin'

const FORM_TABS: { id: FormEventTab; label: string }[] = [
  { id: 'detalle', label: 'Detalle del Evento' },
  { id: 'personal', label: 'Personal' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'utensilios', label: 'Utensilios' },
  { id: 'resumen', label: 'Resumen' },
]

const emptyAssignments = (): StaffAssignmentResult['assignments'] => ({
  ventas: [],
  inventario: [],
  logistica: [],
  caja: [],
})

function buildAssignmentFromHistory(
  eventId: string,
  records: StaffAssignmentRecord[]
): StaffAssignmentResult['assignments'] {
  const result = emptyAssignments()
  for (const r of records) {
    if (r.eventId !== eventId || r.status !== 'confirmed') continue
    result[r.area].push({ employeeId: r.employeeId, employeeName: r.employeeName, area: r.area })
  }
  return result
}

interface EventFormDialogProps {
  open: boolean
  onClose: () => void
  event?: LibroSysEvent | null
  mode: 'create' | 'edit'
}

export function EventFormDialog({ open, onClose, event, mode }: EventFormDialogProps) {
  const { runAssignment, confirmAssignments, history } = useStaffAssignment()
  const { registerEvent, updateEvent } = useERP()
  const { getExtended, saveExtended } = useEventExtended()
  const { showSuccess } = useToast()

  const [activeTab, setActiveTab] = useState<FormEventTab>('detalle')
  const [error, setError] = useState('')

  const [detailForm, setDetailForm] = useState<EventDetailForm>({
    code: nextEventId(),
    name: '',
    type: 'feria',
    publishers: [],
    location: '',
    startDate: '',
    endDate: '',
    responsible: 'Laura Méndez',
    budget: '',
    capacity: '',
    notes: '',
  })

  const [requirements, setRequirements] = useState<StaffRequirements>({
    ventas: 4,
    inventario: 2,
    logistica: 1,
    caja: 2,
  })
  const [assignment, setAssignment] = useState(emptyAssignments())
  const [warnings, setWarnings] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)
  const [staffConfirmed, setStaffConfirmed] = useState(false)

  const [inventory, setInventory] = useState(getExtended('').inventory)
  const [utensils, setUtensils] = useState(getExtended('').utensils)
  const [operationalCost, setOperationalCost] = useState(0)

  useEffect(() => {
    if (!open) return
    setActiveTab('detalle')
    setError('')
    if (mode === 'edit' && event) {
      const ext = getExtended(event.id)
      setDetailForm({
        code: event.id,
        name: event.name,
        type: event.type,
        publishers: ext.publishers.length ? ext.publishers : event.publisher ? [event.publisher] : [],
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        responsible: event.responsible ?? 'Laura Méndez',
        budget: String(event.budget ?? 0),
        capacity: String(ext.capacity || ''),
        notes: ext.notes,
      })
      setInventory(ext.inventory)
      setUtensils(ext.utensils)
      setOperationalCost(ext.operationalCost)
      const loadedAssignment = buildAssignmentFromHistory(event.id, history)
      setAssignment(loadedAssignment)
      setGenerated(hasAssignments(loadedAssignment))
      setStaffConfirmed(hasAssignments(loadedAssignment))
    } else {
      setDetailForm({
        code: nextEventId(),
        name: '',
        type: 'feria',
        publishers: publisherNames[0] ? [publisherNames[0]] : [],
        location: '',
        startDate: '',
        endDate: '',
        responsible: 'Laura Méndez',
        budget: '',
        capacity: '',
        notes: '',
      })
      setInventory([])
      setUtensils([])
      setOperationalCost(0)
      setAssignment(emptyAssignments())
      setWarnings([])
      setGenerated(false)
      setStaffConfirmed(false)
    }
  }, [open, mode, event, getExtended, history])

  const fullyLocked = event ? isEventFullyLocked(event.status) : false
  const staffReadOnly = fullyLocked || (mode === 'edit' && event ? isEventDetailLocked(event.status) : false)
  const inventoryReadOnly = fullyLocked
  const utensilsReadOnly = fullyLocked

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
    detailForm.publishers.length > 0 &&
    (mode === 'edit' || (staffConfirmed && hasAssignments(assignment)))

  const tabIndex = FORM_TABS.findIndex((t) => t.id === activeTab)

  function handleRequirementChange(area: keyof StaffRequirements, value: string) {
    setRequirements((prev) => ({ ...prev, [area]: Math.max(0, parseInt(value, 10) || 0) }))
  }

  function handleGenerate(regenerate = false) {
    const result = runAssignment({
      requirements,
      startDate: detailForm.startDate,
      endDate: detailForm.endDate,
      random: regenerate ? Math.random : Math.random,
    })
    setAssignment(result.assignments)
    setWarnings(result.warnings)
    setGenerated(hasAssignments(result.assignments) || result.warnings.length > 0)
    setStaffConfirmed(false)
  }

  function handleConfirmStaff() {
    if (!hasAssignments(assignment)) return
    setStaffConfirmed(true)
  }

  function handleSave() {
    if (!canSave) {
      setError(validation.errors[0] ?? 'Complete todos los campos obligatorios.')
      return
    }

    const publisher = detailForm.publishers[0] ?? ''
    const staffCount = Object.values(requirements).reduce((s, n) => s + n, 0)

    if (mode === 'create') {
      const result = registerEvent({
        id: detailForm.code,
        name: trim(detailForm.name),
        type: detailForm.type,
        startDate: detailForm.startDate,
        endDate: detailForm.endDate,
        location: trim(detailForm.location),
        publisher,
        budget: Number(detailForm.budget) || 0,
        responsible: detailForm.responsible,
        staffCount,
      })
      if (!result.success) {
        setError(result.errors?.join(' ') ?? 'Error al guardar')
        return
      }
      confirmAssignments({
        eventId: detailForm.code,
        eventName: detailForm.name,
        startDate: detailForm.startDate,
        endDate: detailForm.endDate,
        assignments: assignment,
      })
    } else if (event) {
      const locked = isEventDetailLocked(event.status)
      const result = updateEvent({
        eventId: event.id,
        name: locked ? event.name : trim(detailForm.name),
        type: locked ? event.type : detailForm.type,
        startDate: locked ? event.startDate : detailForm.startDate,
        endDate: locked ? event.endDate : detailForm.endDate,
        location: locked ? event.location : trim(detailForm.location),
        publisher: locked ? (event.publisher ?? publisher) : publisher,
        budget: locked ? (event.budget ?? 0) : Number(detailForm.budget) || 0,
        responsible: locked ? (event.responsible ?? '') : detailForm.responsible,
        participants: event.participants,
        reservations: event.reservations,
      })
      if (!result.success) {
        setError(result.errors?.join(' ') ?? 'Error al guardar')
        return
      }
    }

    saveExtended({
      eventId: mode === 'edit' && event ? event.id : detailForm.code,
      publishers: detailForm.publishers,
      capacity: Number(detailForm.capacity) || 0,
      notes: detailForm.notes,
      operationalCost,
      inventory,
      utensils,
    })

    showSuccess(mode === 'create' ? 'Evento registrado correctamente' : 'Evento actualizado correctamente')
    onClose()
  }

  return (
    <EventModalShell
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Evento' : 'Editar Evento'}
      subtitle={mode === 'edit' && event ? event.id : 'Complete las pestañas para registrar el evento'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {tabIndex > 0 && (
            <Button variant="outline" icon={ChevronLeft} onClick={() => setActiveTab(FORM_TABS[tabIndex - 1].id)}>
              Anterior
            </Button>
          )}
          {tabIndex < FORM_TABS.length - 1 && (
            <Button variant="outline" icon={ChevronRight} onClick={() => setActiveTab(FORM_TABS[tabIndex + 1].id)}>
              Siguiente
            </Button>
          )}
          <Button icon={Save} onClick={handleSave} disabled={!canSave}>
            {mode === 'create' ? 'Confirmar Evento' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <EventTabBar tabs={FORM_TABS} active={activeTab} onChange={setActiveTab} />
        {fullyLocked && (
          <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
            Este evento está finalizado. No se permiten modificaciones.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</div>
        )}

        {activeTab === 'detalle' && (
          <EventDetailTabContent
            form={detailForm}
            onChange={setDetailForm}
            status={event?.status}
          />
        )}
        {activeTab === 'personal' && (
          <EventStaffTabContent
            requirements={requirements}
            onRequirementChange={handleRequirementChange}
            assignment={assignment}
            warnings={warnings}
            generated={generated}
            confirmed={staffConfirmed}
            onGenerate={handleGenerate}
            onConfirm={handleConfirmStaff}
            readOnly={staffReadOnly}
          />
        )}
        {activeTab === 'inventario' && (
          <EventInventoryTabContent items={inventory} onChange={setInventory} readOnly={inventoryReadOnly} />
        )}
        {activeTab === 'utensilios' && (
          <EventUtensilsTabContent items={utensils} onChange={setUtensils} readOnly={utensilsReadOnly} />
        )}
        {activeTab === 'resumen' && (
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
              <p><strong>Productos asignados:</strong> {inventory.length}</p>
              <p><strong>Utensilios:</strong> {utensils.length}</p>
            </div>
          </div>
        )}
      </div>
    </EventModalShell>
  )
}
