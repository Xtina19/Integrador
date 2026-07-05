export type StaffArea = 'ventas' | 'inventario' | 'logistica' | 'caja'

export interface Employee {
  id: string
  name: string
  area: StaffArea
  status: 'active' | 'inactive'
  available: boolean
  eventsParticipated: number
}

export interface StaffRequirements {
  ventas: number
  inventario: number
  logistica: number
  caja: number
}

export interface AssignedStaffMember {
  employeeId: string
  employeeName: string
  area: StaffArea
}

export interface StaffAssignmentResult {
  assignments: Record<StaffArea, AssignedStaffMember[]>
  warnings: string[]
}

export interface StaffAssignmentRecord {
  id: string
  eventId: string
  eventName: string
  employeeId: string
  employeeName: string
  area: StaffArea
  startDate: string
  endDate: string
  status: 'confirmed' | 'proposed'
}

export interface EventDateRange {
  eventId: string
  startDate: string
  endDate: string
}

export const STAFF_AREA_LABELS: Record<StaffArea, string> = {
  ventas: 'Ventas',
  inventario: 'Inventario',
  logistica: 'Logística',
  caja: 'Caja',
}

export const STAFF_REQUIREMENT_LABELS: Record<keyof StaffRequirements, string> = {
  ventas: 'Vendedores',
  inventario: 'Inventario',
  logistica: 'Logística',
  caja: 'Caja',
}
