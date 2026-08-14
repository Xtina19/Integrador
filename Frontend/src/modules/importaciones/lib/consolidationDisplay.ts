import type { Consolidation } from '@/types/domain'

export const consolidationStatusMap: Record<
  Consolidation['status'],
  { label: string; variant: 'success' | 'neutral' | 'warning' | 'info' }
> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  processed: { label: 'Procesado', variant: 'info' },
  closed: { label: 'Cerrado', variant: 'success' },
}
