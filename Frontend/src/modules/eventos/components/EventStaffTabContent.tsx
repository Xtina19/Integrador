import { Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { hasAssignments } from '@/lib/staffAssignmentEngine'
import type { StaffArea, StaffAssignmentResult, StaffRequirements } from '@/types/staffAssignment'
import { STAFF_AREA_LABELS, STAFF_REQUIREMENT_LABELS } from '@/types/staffAssignment'

const AREAS: StaffArea[] = ['ventas', 'inventario', 'logistica', 'caja']

interface EventStaffTabContentProps {
  requirements: StaffRequirements
  onRequirementChange: (area: keyof StaffRequirements, value: string) => void
  assignment: StaffAssignmentResult['assignments']
  warnings: string[]
  generated: boolean
  confirmed: boolean
  onGenerate: (regenerate?: boolean) => void
  onConfirm: () => void
  readOnly?: boolean
}

export function EventStaffTabContent({
  requirements,
  onRequirementChange,
  assignment,
  warnings,
  generated,
  confirmed,
  onGenerate,
  onConfirm,
  readOnly = false,
}: EventStaffTabContentProps) {
  const totalRequired = Object.values(requirements).reduce((s, n) => s + n, 0)
  const hasProposal = AREAS.some((area) => assignment[area].length > 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        El sistema consulta empleados disponibles, verifica participación reciente y aplica rotación automática.
        No se permite selección manual.
      </p>

      {!readOnly && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(STAFF_REQUIREMENT_LABELS) as (keyof StaffRequirements)[]).map((area) => (
              <Input
                key={area}
                label={STAFF_REQUIREMENT_LABELS[area]}
                type="number"
                min={0}
                value={requirements[area]}
                onChange={(e) => onRequirementChange(area, e.target.value)}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Total solicitado: <span className="font-medium text-gray-600">{totalRequired}</span> personas
          </p>
          <div className="flex flex-wrap gap-2">
            <Button icon={Sparkles} onClick={() => onGenerate(false)}>
              Generar Asignación
            </Button>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => onGenerate(true)}
              disabled={!generated && !hasAssignments(assignment)}
            >
              Regenerar Asignación
            </Button>
            {hasAssignments(assignment) && !confirmed && (
              <Button variant="secondary" icon={CheckCircle2} onClick={onConfirm}>
                Confirmar Asignación
              </Button>
            )}
          </div>
        </>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w) => (
            <div key={w} className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
              {w}
            </div>
          ))}
        </div>
      )}

      {hasProposal && (
        <div className="rounded-lg border border-gray-200 bg-surface p-6 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">
            {readOnly ? 'Personal asignado' : 'Propuesta de asignación'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AREAS.map((area) => {
              const members = assignment[area]
              if (members.length === 0) return null
              return (
                <div key={area}>
                  <p className="text-xs font-semibold text-corporate uppercase tracking-wide mb-2">
                    {STAFF_AREA_LABELS[area]}
                  </p>
                  <ul className="space-y-1.5">
                    {members.map((m) => (
                      <li key={m.employeeId} className="flex items-center gap-2 text-sm text-gray-800">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        {m.employeeName}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          {confirmed && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
              Rotación aplicada correctamente
            </p>
          )}
        </div>
      )}

      {!readOnly && !generated && !hasAssignments(assignment) && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
          <Sparkles size={28} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            Complete las fechas del evento y presione <strong>Generar Asignación</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
