import type { PurchaseStatus, TransferStatus, ImportStatus, EventStatus } from '../types/domain'

const purchaseTransitions: Record<PurchaseStatus, PurchaseStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: ['finalized'],
  finalized: [],
  cancelled: [],
}

const transferTransitions: Record<TransferStatus, TransferStatus[]> = {
  requested: ['approved'],
  approved: ['in_transit'],
  in_transit: ['received'],
  received: ['finalized'],
  finalized: [],
}

const importTransitions: Record<ImportStatus, ImportStatus[]> = {
  registered: ['in_transit'],
  in_transit: ['customs'],
  customs: ['received'],
  received: ['costed'],
  costed: ['finalized'],
  finalized: [],
}

const eventTransitions: Record<EventStatus, EventStatus[]> = {
  scheduled: ['staff_assigned'],
  staff_assigned: ['in_progress'],
  in_progress: ['finalized'],
  finalized: [],
}

export function canTransitionPurchase(from: PurchaseStatus, to: PurchaseStatus): boolean {
  return purchaseTransitions[from]?.includes(to) ?? false
}

export function canTransitionTransfer(from: TransferStatus, to: TransferStatus): boolean {
  return transferTransitions[from]?.includes(to) ?? false
}

export function canTransitionImport(from: ImportStatus, to: ImportStatus): boolean {
  return importTransitions[from]?.includes(to) ?? false
}

export function canTransitionEvent(from: EventStatus, to: EventStatus): boolean {
  return eventTransitions[from]?.includes(to) ?? false
}

export const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  approved: 'Aprobada',
  received: 'Recibida',
  finalized: 'Finalizada',
  cancelled: 'Cancelada',
}

export const transferStatusLabels: Record<TransferStatus, string> = {
  requested: 'Solicitada',
  approved: 'Aprobada',
  in_transit: 'En tránsito',
  received: 'Recibida',
  finalized: 'Finalizada',
}

export const importStatusLabels: Record<ImportStatus, string> = {
  registered: 'Registrado',
  in_transit: 'En tránsito',
  customs: 'En Aduana',
  received: 'Recibido',
  costed: 'Costeado',
  finalized: 'Finalizado',
}

export const eventStatusLabels: Record<EventStatus, string> = {
  scheduled: 'Programado',
  staff_assigned: 'Personal Asignado',
  in_progress: 'En Curso',
  finalized: 'Finalizado',
}
