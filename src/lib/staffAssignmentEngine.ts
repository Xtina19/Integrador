import type {
  Employee,
  StaffArea,
  StaffRequirements,
  StaffAssignmentResult,
  AssignedStaffMember,
  StaffAssignmentRecord,
} from '../types/staffAssignment'
import { STAFF_AREA_LABELS } from '../types/staffAssignment'

const AREAS: StaffArea[] = ['ventas', 'inventario', 'logistica', 'caja']

export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && startB <= endA
}

function getBusyEmployeeIds(
  startDate: string,
  endDate: string,
  history: StaffAssignmentRecord[],
  excludeEventId?: string
): Set<string> {
  const busy = new Set<string>()

  for (const record of history) {
    if (record.status !== 'confirmed') continue
    if (excludeEventId && record.eventId === excludeEventId) continue
    if (datesOverlap(startDate, endDate, record.startDate, record.endDate)) {
      busy.add(record.employeeId)
    }
  }

  return busy
}

function shuffleWithRandom<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickForArea(
  area: StaffArea,
  count: number,
  employees: Employee[],
  usedIds: Set<string>,
  random: () => number
): { selected: AssignedStaffMember[]; shortage: number } {
  if (count <= 0) return { selected: [], shortage: 0 }

  const pool = employees.filter(
    (e) => e.area === area && !usedIds.has(e.id)
  )

  const selected: AssignedStaffMember[] = []
  const remaining = [...pool]

  while (selected.length < count && remaining.length > 0) {
    const minParticipation = Math.min(...remaining.map((e) => e.eventsParticipated))
    const tier = remaining.filter((e) => e.eventsParticipated === minParticipation)
    const shuffled = shuffleWithRandom(tier, random)
    const pick = shuffled[0]
    if (!pick) break

    selected.push({
      employeeId: pick.id,
      employeeName: pick.name,
      area,
    })
    usedIds.add(pick.id)
    const idx = remaining.findIndex((e) => e.id === pick.id)
    if (idx >= 0) remaining.splice(idx, 1)
  }

  return { selected, shortage: Math.max(0, count - selected.length) }
}

export interface GenerateAssignmentParams {
  requirements: StaffRequirements
  startDate: string
  endDate: string
  employees: Employee[]
  history: StaffAssignmentRecord[]
  excludeEventId?: string
  random?: () => number
}

export function generateStaffAssignment({
  requirements,
  startDate,
  endDate,
  employees,
  history,
  excludeEventId,
  random = Math.random,
}: GenerateAssignmentParams): StaffAssignmentResult {
  const warnings: string[] = []

  if (!startDate || !endDate) {
    return {
      assignments: { ventas: [], inventario: [], logistica: [], caja: [] },
      warnings: ['Indique las fechas del evento antes de generar la asignación.'],
    }
  }

  const busyIds = getBusyEmployeeIds(startDate, endDate, history, excludeEventId)

  const eligible = employees.filter(
    (e) =>
      e.status === 'active' &&
      e.available &&
      !busyIds.has(e.id)
  )

  const usedIds = new Set<string>()
  const assignments: Record<StaffArea, AssignedStaffMember[]> = {
    ventas: [],
    inventario: [],
    logistica: [],
    caja: [],
  }

  for (const area of AREAS) {
    const count = requirements[area]
    const { selected, shortage } = pickForArea(area, count, eligible, usedIds, random)
    assignments[area] = selected

    if (shortage > 0) {
      warnings.push(
        `Solo se asignaron ${selected.length} de ${count} en ${STAFF_AREA_LABELS[area]}. No hay personal elegible suficiente.`
      )
    }
  }

  const totalRequired = Object.values(requirements).reduce((s, n) => s + n, 0)
  const totalAssigned = AREAS.reduce((s, a) => s + assignments[a].length, 0)

  if (totalRequired > 0 && totalAssigned === 0) {
    warnings.push(
      'No se encontró personal disponible para las fechas seleccionadas. Verifique conflictos con otros eventos.'
    )
  }

  return { assignments, warnings }
}

export function flattenAssignments(
  assignments: Record<StaffArea, AssignedStaffMember[]>
): AssignedStaffMember[] {
  return AREAS.flatMap((area) => assignments[area])
}

export function hasAssignments(assignments: Record<StaffArea, AssignedStaffMember[]>): boolean {
  return AREAS.some((area) => assignments[area].length > 0)
}
