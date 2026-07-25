import type {
  AjusteEstadoUi,
  ConteoEstadoUi,
  DescarteEstadoUi,
  TransferenciaEstadoUi,
} from '../types/inventoryUi'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold'

export function transferenciaBadge(estado: TransferenciaEstadoUi): BadgeVariant {
  const map: Record<TransferenciaEstadoUi, BadgeVariant> = {
    borrador: 'neutral',
    solicitada: 'warning',
    en_transito: 'gold',
    recibida_parcial: 'warning',
    recibida: 'success',
    cancelada: 'danger',
  }
  return map[estado]
}

export function descarteBadge(estado: DescarteEstadoUi): BadgeVariant {
  const map: Record<DescarteEstadoUi, BadgeVariant> = {
    borrador: 'neutral',
    solicitado: 'warning',
    aprobado: 'info',
    rechazado: 'danger',
    aplicado: 'success',
    cancelado: 'neutral',
    revertido: 'gold',
  }
  return map[estado]
}

export function conteoBadge(estado: ConteoEstadoUi): BadgeVariant {
  const map: Record<ConteoEstadoUi, BadgeVariant> = {
    borrador: 'neutral',
    abierto: 'info',
    en_conteo: 'gold',
    en_revision: 'warning',
    cerrado: 'success',
    cancelado: 'danger',
  }
  return map[estado]
}

export function ajusteBadge(estado: AjusteEstadoUi): BadgeVariant {
  const map: Record<AjusteEstadoUi, BadgeVariant> = {
    borrador: 'neutral',
    solicitado: 'warning',
    aprobado: 'info',
    rechazado: 'danger',
    aplicado: 'success',
    cancelado: 'neutral',
    revertido: 'gold',
  }
  return map[estado]
}

export function stockEstadoBadge(estado: 'normal' | 'bajo' | 'agotado'): BadgeVariant {
  if (estado === 'bajo') return 'warning'
  if (estado === 'agotado') return 'danger'
  return 'success'
}
