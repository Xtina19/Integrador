import { toDateInputValue } from '@/lib/editorialesDisplay'

export type ContractVisualStatus = 'active' | 'expiring' | 'expired' | 'none'

export function daysUntilExpiry(expiryDate: string, reference = new Date()): number | null {
  const iso = toDateInputValue(expiryDate)
  if (!iso) return null
  const expiry = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(expiry.getTime())) return null
  const ref = new Date(reference)
  ref.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24))
}

export function getContractVisualStatus(expiryDate: string, reference = new Date()): ContractVisualStatus {
  const diffDays = daysUntilExpiry(expiryDate, reference)
  if (diffDays === null) return 'none'
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring'
  return 'active'
}

export const contractStatusConfig: Record<
  ContractVisualStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  active: { label: 'Vigente', variant: 'success' },
  expiring: { label: 'Por vencer', variant: 'warning' },
  expired: { label: 'Vencido', variant: 'danger' },
  none: { label: 'Sin fecha', variant: 'neutral' },
}

export function isContractExpiringSoon(expiryDate: string) {
  return getContractVisualStatus(expiryDate) === 'expiring'
}
