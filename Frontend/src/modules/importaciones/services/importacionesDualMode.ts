import { importacionesApi } from './importacionesApi'

export function isImportacionesSyncedToApi(entity?: { dbId?: number | null }): boolean {
  return importacionesApi.isEnabled() && entity?.dbId != null && entity.dbId > 0
}

export function shouldUseLocalImportaciones(entity?: { dbId?: number | null }): boolean {
  return !isImportacionesSyncedToApi(entity)
}
