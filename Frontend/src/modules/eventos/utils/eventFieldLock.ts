import type { EventStatus } from '@/types/domain'

/** Campos principales bloqueados cuando el evento está en curso */
export function isEventDetailLocked(status: EventStatus): boolean {
  return status === 'in_progress'
}

/** Todo el formulario en solo lectura cuando el evento está finalizado o cancelado */
export function isEventFullyLocked(status: EventStatus): boolean {
  return status === 'finalized' || status === 'cancelled'
}

export function isEventEditable(status: EventStatus): boolean {
  return !isEventFullyLocked(status)
}
