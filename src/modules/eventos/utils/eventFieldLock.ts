import type { EventStatus } from '@/types/domain'

/** Campos principales bloqueados cuando el evento está en curso */
export function isEventDetailLocked(status: EventStatus): boolean {
  return status === 'in_progress'
}

/** Todo el formulario en solo lectura cuando el evento está finalizado */
export function isEventFullyLocked(status: EventStatus): boolean {
  return status === 'finalized'
}
