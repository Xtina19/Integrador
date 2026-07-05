import type { Transfer } from '@/types/domain'
import type { ERPState } from '@/store/initialState'
import { canTransitionTransfer } from '@/constants/stateMachines'
import { validateTransferFinalize, validateTransfer } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { createActivity, createNotification } from '@/services/activityService'
import { nextId } from '@/utils/idGenerator'
import { nowFormatted } from '@/utils/timeUtils'

export interface CreateTransferInput {
  origin: string
  destination: string
  product: string
  qty: number
  transport: string
}

export const transferService = {
  createRequest(_state: ERPState, input: CreateTransferInput) {
    const validation = validateTransfer({
      origin: input.origin,
      destination: input.destination,
      product: input.product,
      qty: input.qty,
      transport: input.transport,
    })
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const transfer: Transfer = {
      id: nextId('TR'),
      origin: trim(input.origin),
      destination: trim(input.destination),
      product: trim(input.product),
      qty: input.qty,
      status: 'requested',
      date: nowFormatted().slice(0, 10),
      transport: input.transport,
    }

    return {
      success: true as const,
      transfer,
      activity: createActivity(`Solicitud de transferencia ${transfer.id} creada.`, 'Transferencias'),
      notification: createNotification('info', 'Nueva transferencia', `${transfer.id} — ${input.product}`, 'Transferencias'),
    }
  },

  approve(state: ERPState, transferId: string) {
    const transfer = state.transfers.find((t) => t.id === transferId)
    if (!transfer) return { success: false as const, errors: ['Transferencia no encontrada.'] }
    if (!canTransitionTransfer(transfer.status, 'approved')) {
      return { success: false as const, errors: ['No se puede aprobar en el estado actual.'] }
    }
    return {
      success: true as const,
      transferId,
      newStatus: 'approved' as const,
      activity: createActivity(`Transferencia ${transferId} aprobada.`, 'Transferencias'),
      notification: createNotification('success', 'Transferencia aprobada', transferId, 'Transferencias'),
    }
  },

  ship(state: ERPState, transferId: string) {
    const transfer = state.transfers.find((t) => t.id === transferId)
    if (!transfer) return { success: false as const, errors: ['Transferencia no encontrada.'] }
    if (!canTransitionTransfer(transfer.status, 'in_transit')) {
      return { success: false as const, errors: ['La transferencia debe estar aprobada.'] }
    }
    return {
      success: true as const,
      transferId,
      newStatus: 'in_transit' as const,
      activity: createActivity(`Transferencia ${transferId} en tránsito.`, 'Transferencias'),
    }
  },

  receive(state: ERPState, transferId: string) {
    const transfer = state.transfers.find((t) => t.id === transferId)
    if (!transfer) return { success: false as const, errors: ['Transferencia no encontrada.'] }
    if (!canTransitionTransfer(transfer.status, 'received')) {
      return { success: false as const, errors: ['No se puede finalizar una transferencia pendiente.'] }
    }
    return {
      success: true as const,
      transferId,
      newStatus: 'received' as const,
      activity: createActivity(`Transferencia ${transferId} recibida en destino.`, 'Transferencias'),
    }
  },

  finalize(state: ERPState, transferId: string) {
    const transfer = state.transfers.find((t) => t.id === transferId)
    if (!transfer) return { success: false as const, errors: ['Transferencia no encontrada.'] }
    const check = validateTransferFinalize(transfer.status)
    if (!check.valid) return { success: false as const, errors: check.errors }
    if (!canTransitionTransfer(transfer.status, 'finalized')) {
      return { success: false as const, errors: ['No se puede finalizar en el estado actual.'] }
    }

    const historyItem = {
      id: transfer.id,
      origin: transfer.origin,
      destination: transfer.destination,
      product: transfer.product,
      qty: transfer.qty,
      status: 'finalized' as const,
      date: nowFormatted().slice(0, 10),
    }

    return {
      success: true as const,
      transferId,
      historyItem,
      activity: createActivity(`Transferencia ${transferId} finalizada.`, 'Transferencias'),
    }
  },
}
