import { comprasApi } from '@/services/api/comprasApi'

/** Registro con id numérico de BD → mutaciones vía API. Sin dbId → flujo local en memoria. */
export function isComprasSyncedToApi(entity?: { dbId?: number | null }): boolean {
  return comprasApi.isEnabled() && entity?.dbId != null && entity.dbId > 0
}

export function shouldUseLocalCompras(entity?: { dbId?: number | null }): boolean {
  return !isComprasSyncedToApi(entity)
}
