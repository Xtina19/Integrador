import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { eventExtendedSeed } from '@/mocks/mockEventos'
import type { EventExtendedData, EventInventoryItem, EventUtensil } from '@/modules/eventos/types/eventExtended'

function emptyExtended(eventId: string): EventExtendedData {
  return {
    eventId,
    publishers: [],
    capacity: 0,
    notes: '',
    operationalCost: 0,
    inventory: [],
    utensils: [],
  }
}

interface EventExtendedContextValue {
  getExtended: (eventId: string) => EventExtendedData
  saveExtended: (data: EventExtendedData) => void
  updateInventory: (eventId: string, inventory: EventInventoryItem[]) => void
  updateUtensils: (eventId: string, utensils: EventUtensil[]) => void
}

const EventExtendedContext = createContext<EventExtendedContextValue | null>(null)

export function EventExtendedProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<EventExtendedData[]>(() =>
    eventExtendedSeed.map((r) => ({ ...r, inventory: [...r.inventory], utensils: [...r.utensils], publishers: [...r.publishers] }))
  )

  const getExtended = useCallback(
    (eventId: string): EventExtendedData => {
      const found = records.find((r) => r.eventId === eventId)
      if (found) return { ...found, inventory: [...found.inventory], utensils: [...found.utensils], publishers: [...found.publishers] }
      return emptyExtended(eventId)
    },
    [records]
  )

  const saveExtended = useCallback((data: EventExtendedData) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.eventId === data.eventId)
      const copy = { ...data, inventory: [...data.inventory], utensils: [...data.utensils], publishers: [...data.publishers] }
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = copy
        return next
      }
      return [...prev, copy]
    })
  }, [])

  const updateInventory = useCallback((eventId: string, inventory: EventInventoryItem[]) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.eventId === eventId)
      if (idx < 0) return [...prev, { ...emptyExtended(eventId), inventory }]
      const next = [...prev]
      next[idx] = { ...next[idx], inventory }
      return next
    })
  }, [])

  const updateUtensils = useCallback((eventId: string, utensils: EventUtensil[]) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.eventId === eventId)
      if (idx < 0) return [...prev, { ...emptyExtended(eventId), utensils }]
      const next = [...prev]
      next[idx] = { ...next[idx], utensils }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ getExtended, saveExtended, updateInventory, updateUtensils }),
    [getExtended, saveExtended, updateInventory, updateUtensils]
  )

  return <EventExtendedContext.Provider value={value}>{children}</EventExtendedContext.Provider>
}

export function useEventExtended() {
  const ctx = useContext(EventExtendedContext)
  if (!ctx) throw new Error('useEventExtended debe usarse dentro de EventExtendedProvider')
  return ctx
}
