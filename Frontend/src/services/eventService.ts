import type { LibroSysEvent } from '@/types/domain'
import type { ERPState } from '@/store/initialState'
import { canTransitionEvent } from '@/constants/stateMachines'
import { validateEvent } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { createActivity, createNotification } from '@/services/activityService'
import { nextSimpleId } from '@/utils/idGenerator'

export interface CreateEventInput {
  id?: string
  name: string
  type: string
  startDate: string
  endDate: string
  location: string
  publisher: string
  budget: number
  responsible: string
  staffCount: number
}

export interface UpdateEventInput {
  eventId: string
  name: string
  type: string
  startDate: string
  endDate: string
  location: string
  publisher: string
  budget: number
  responsible: string
  participants: number
  reservations: number
}

export const eventService = {
  registerEvent(_state: ERPState, input: CreateEventInput) {
    const validation = validateEvent({
      name: input.name,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      location: trim(input.location),
      publisher: input.publisher,
      budget: input.budget,
      responsible: input.responsible,
    })
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const event: LibroSysEvent = {
      id: input.id ?? nextSimpleId('EV'),
      name: trim(input.name),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      location: trim(input.location),
      publisher: input.publisher,
      budget: input.budget,
      responsible: input.responsible,
      status: input.staffCount > 0 ? 'staff_assigned' : 'scheduled',
      participants: input.staffCount,
      reservations: 0,
    }

    return {
      success: true as const,
      event,
      activity: createActivity(`Nuevo evento registrado: ${event.name}.`, 'Eventos'),
      notification: createNotification('info', 'Evento próximo', event.name, 'Eventos'),
    }
  },

  markInProgress(state: ERPState, eventId: string) {
    const event = state.events.find((e) => e.id === eventId)
    if (!event) return { success: false as const, errors: ['Evento no encontrado.'] }
    const target = event.status === 'staff_assigned' ? 'in_progress' : 'staff_assigned'
    if (!canTransitionEvent(event.status, target)) {
      return { success: false as const, errors: ['Transición no permitida.'] }
    }
    return { success: true as const, eventId, newStatus: target }
  },

  updateEvent(state: ERPState, input: UpdateEventInput) {
    const event = state.events.find((e) => e.id === input.eventId)
    if (!event) return { success: false as const, errors: ['Evento no encontrado.'] }
    const validation = validateEvent({
      name: input.name,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      location: input.location,
      publisher: input.publisher,
      budget: input.budget,
      responsible: input.responsible,
    })
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const updated: LibroSysEvent = {
      ...event,
      name: trim(input.name),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      location: trim(input.location),
      publisher: input.publisher,
      budget: input.budget,
      responsible: input.responsible,
      participants: input.participants,
      reservations: input.reservations,
    }

    return {
      success: true as const,
      event: updated,
      activity: createActivity(`Evento actualizado: ${updated.name}.`, 'Eventos'),
    }
  },

  deleteEvent(state: ERPState, eventId: string) {
    const event = state.events.find((e) => e.id === eventId)
    if (!event) return { success: false as const, errors: ['Evento no encontrado.'] }
    if (event.status === 'in_progress') {
      return { success: false as const, errors: ['No se puede eliminar un evento en curso.'] }
    }
    return {
      success: true as const,
      eventId,
      activity: createActivity(`Evento eliminado: ${event.name}.`, 'Eventos'),
    }
  },
}
