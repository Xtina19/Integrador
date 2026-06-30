import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Sparkles, RefreshCw, Users } from 'lucide-react'
import { FormBreadcrumb } from '../../components/ui/FormBreadcrumb'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { publisherNames } from '../../data/adminMockData'
import { useStaffAssignment, nextEventId } from '../../context/StaffAssignmentContext'
import { useERP } from '../../store/ERPProvider'
import { hasAssignments } from '../../lib/staffAssignmentEngine'
import { validateEvent } from '../../business-rules/validators'
import { trim } from '../../utils/formValidation'
import type { StaffArea, StaffAssignmentResult, StaffRequirements } from '../../types/staffAssignment'
import { STAFF_AREA_LABELS, STAFF_REQUIREMENT_LABELS } from '../../types/staffAssignment'

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

const AREAS: StaffArea[] = ['ventas', 'inventario', 'logistica', 'caja']

const emptyAssignments = (): StaffAssignmentResult['assignments'] => ({
  ventas: [],
  inventario: [],
  logistica: [],
  caja: [],
})

export function NuevoEventoPage() {
  const navigate = useNavigate()
  const { runAssignment, confirmAssignments } = useStaffAssignment()
  const { registerEvent } = useERP()

  const [form, setForm] = useState({
    name: '',
    type: 'feria',
    startDate: '',
    endDate: '',
    location: '',
    publisher: publisherNames[0] ?? '',
    budget: '',
    responsible: responsables[0],
  })

  const [requirements, setRequirements] = useState<StaffRequirements>({
    ventas: 4,
    inventario: 2,
    logistica: 1,
    caja: 2,
  })

  const [assignment, setAssignment] = useState<StaffAssignmentResult['assignments']>(emptyAssignments())
  const [warnings, setWarnings] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')

  const validation = useMemo(() => validateEvent(form), [form])
  const canConfirm = validation.valid && hasAssignments(assignment)

  function handleRequirementChange(area: keyof StaffRequirements, value: string) {
    const num = Math.max(0, parseInt(value, 10) || 0)
    setRequirements((prev) => ({ ...prev, [area]: num }))
  }

  function handleGenerate(regenerate = false) {
    const result = runAssignment({
      requirements,
      startDate: form.startDate,
      endDate: form.endDate,
      random: regenerate ? Math.random : Math.random,
    })
    setAssignment(result.assignments)
    setWarnings(result.warnings)
    setGenerated(hasAssignments(result.assignments) || result.warnings.length > 0)
  }

  function handleConfirm() {
    if (!canConfirm) {
      setError(validation.valid ? 'Debe generar la asignación de personal antes de confirmar.' : validation.errors[0])
      return
    }

    const eventId = nextEventId()
    const staffCount = Object.values(requirements).reduce((s, n) => s + n, 0)

    const result = registerEvent({
      id: eventId,
      name: trim(form.name),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      location: trim(form.location),
      publisher: form.publisher,
      budget: Number(form.budget) || 0,
      responsible: form.responsible,
      staffCount,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al registrar el evento')
      return
    }

    confirmAssignments({
      eventId,
      eventName: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      assignments: assignment,
    })
    navigate('/eventos')
  }

  const totalRequired = Object.values(requirements).reduce((s, n) => s + n, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FormBreadcrumb
          items={[
            { label: 'Eventos y Ferias', to: '/eventos' },
            { label: 'Nuevo Evento' },
          ]}
        />
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/eventos')}>
          Regresar
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Nuevo Evento"
          subtitle="Defina las necesidades del evento — el sistema asignará el personal automáticamente"
        />
        <CardBody className="space-y-8">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos del evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nombre del evento *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="md:col-span-2"
              />
              <Select
                label="Tipo de evento *"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={eventTypes}
              />
              <Select
                label="Editorial participante *"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                options={publisherNames.map((p) => ({ value: p, label: p }))}
              />
              <Input
                label="Fecha de inicio *"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                label="Fecha de finalización *"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <Input
                label="Lugar *"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Input
                label="Presupuesto *"
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
              <Select
                label="Responsable del evento *"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                options={responsables.map((r) => ({ value: r, label: r }))}
                className="md:col-span-2"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                <Users size={20} className="text-corporate" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Personal requerido por área</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Indique cuántas personas necesita — no seleccione empleados manualmente.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.keys(STAFF_REQUIREMENT_LABELS) as (keyof StaffRequirements)[]).map((area) => (
                <Input
                  key={area}
                  label={STAFF_REQUIREMENT_LABELS[area]}
                  type="number"
                  min={0}
                  value={requirements[area]}
                  onChange={(e) => handleRequirementChange(area, e.target.value)}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Total solicitado: <span className="font-medium text-gray-600">{totalRequired}</span> personas
            </p>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Motor de asignación inteligente</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rotación equitativa según historial de participación y disponibilidad.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button icon={Sparkles} onClick={() => handleGenerate(false)}>
                  Generar Asignación
                </Button>
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  onClick={() => handleGenerate(true)}
                  disabled={!generated && !hasAssignments(assignment)}
                >
                  Regenerar Asignación
                </Button>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="mb-6 space-y-2">
                {warnings.map((w) => (
                  <div
                    key={w}
                    className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5"
                  >
                    {w}
                  </div>
                ))}
              </div>
            )}

            {hasAssignments(assignment) && (
              <div className="rounded-lg border border-gray-200 bg-surface p-6 space-y-6">
                <h4 className="text-sm font-semibold text-gray-900">Personal Asignado</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {AREAS.map((area) => {
                    const members = assignment[area]
                    if (members.length === 0) return null
                    return (
                      <div key={area}>
                        <p className="text-xs font-semibold text-corporate uppercase tracking-wide mb-3">
                          {STAFF_AREA_LABELS[area]}
                        </p>
                        <ul className="space-y-2">
                          {members.map((m) => (
                            <li
                              key={m.employeeId}
                              className="flex items-center gap-2 text-sm text-gray-800 bg-white rounded-lg px-3 py-2 border border-gray-100"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                              {m.employeeName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                  Selección basada en menor participación histórica, disponibilidad y ausencia de conflictos de fecha.
                </p>
              </div>
            )}

            {!generated && !hasAssignments(assignment) && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
                <Sparkles size={28} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  Complete los datos del evento y presione <strong>Generar Asignación</strong> para obtener una propuesta de personal.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <Button variant="outline" onClick={() => navigate('/eventos')}>
          Cancelar
        </Button>
        <Button
          icon={Save}
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          Confirmar Evento
        </Button>
      </div>
    </div>
  )
}
