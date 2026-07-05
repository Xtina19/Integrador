export type ContractVisualStatus = 'active' | 'expiring' | 'expired'

const REFERENCE_DATE = new Date('2026-06-20')

export function getContractVisualStatus(expiryDate: string): ContractVisualStatus {
  const expiry = new Date(expiryDate + 'T00:00:00')
  const diffMs = expiry.getTime() - REFERENCE_DATE.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring'
  return 'active'
}

export const contractStatusConfig: Record<
  ContractVisualStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  active: { label: 'Contrato Vigente', variant: 'success' },
  expiring: { label: 'Por vencer (<30 días)', variant: 'warning' },
  expired: { label: 'Contrato Vencido', variant: 'danger' },
}

export function isContractExpiringSoon(expiryDate: string) {
  return getContractVisualStatus(expiryDate) === 'expiring'
}
