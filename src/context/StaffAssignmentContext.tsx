import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  assignmentHistorySeed,
  employeesSeed,
} from '@/mocks/mockStaff'
import {
  flattenAssignments,
  generateStaffAssignment,
  type GenerateAssignmentParams,
} from '@/lib/staffAssignmentEngine'
import type {
  Employee,
  StaffAssignmentRecord,
  StaffAssignmentResult,
} from '@/types/staffAssignment'

interface StaffAssignmentContextValue {
  employees: Employee[]
  history: StaffAssignmentRecord[]
  runAssignment: (
    params: Omit<GenerateAssignmentParams, 'employees' | 'history'>
  ) => StaffAssignmentResult
  confirmAssignments: (params: {
    eventId: string
    eventName: string
    startDate: string
    endDate: string
    assignments: StaffAssignmentResult['assignments']
  }) => void
}

const StaffAssignmentContext = createContext<StaffAssignmentContextValue | null>(null)

let eventIdCounter = 100

export function nextEventId(): string {
  eventIdCounter += 1
  return `EV-${String(eventIdCounter).padStart(2, '0')}`
}

export function StaffAssignmentProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeesSeed.map((e) => ({ ...e }))
  )
  const [history, setHistory] = useState<StaffAssignmentRecord[]>(() => [
    ...assignmentHistorySeed,
  ])

  const runAssignment = useCallback(
    (params: Omit<GenerateAssignmentParams, 'employees' | 'history'>) =>
      generateStaffAssignment({
        ...params,
        employees,
        history,
      }),
    [employees, history]
  )

  const confirmAssignments = useCallback(
    ({
      eventId,
      eventName,
      startDate,
      endDate,
      assignments,
    }: {
      eventId: string
      eventName: string
      startDate: string
      endDate: string
      assignments: StaffAssignmentResult['assignments']
    }) => {
      const flat = flattenAssignments(assignments)
      if (flat.length === 0) return

      const newRecords: StaffAssignmentRecord[] = flat.map((a, i) => ({
        id: `ASG-${Date.now()}-${i}`,
        eventId,
        eventName,
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        area: a.area,
        startDate,
        endDate,
        status: 'confirmed' as const,
      }))

      setHistory((prev) => [...prev, ...newRecords])

      setEmployees((prev) =>
        prev.map((emp) => {
          const assigned = flat.find((a) => a.employeeId === emp.id)
          if (!assigned) return emp
          return { ...emp, eventsParticipated: emp.eventsParticipated + 1 }
        })
      )
    },
    []
  )

  const value = useMemo(
    () => ({
      employees,
      history,
      runAssignment,
      confirmAssignments,
    }),
    [employees, history, runAssignment, confirmAssignments]
  )

  return (
    <StaffAssignmentContext.Provider value={value}>{children}</StaffAssignmentContext.Provider>
  )
}

export function useStaffAssignment() {
  const ctx = useContext(StaffAssignmentContext)
  if (!ctx) {
    throw new Error('useStaffAssignment debe usarse dentro de StaffAssignmentProvider')
  }
  return ctx
}
