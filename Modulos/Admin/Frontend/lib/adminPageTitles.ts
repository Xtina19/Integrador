import { ADMIN_MODULES, type AdminModuleKey } from './adminConfig'

const CRUD_SUBTITLES = {
  nuevo: 'Formulario de registro',
  editar: 'Modificación de registro existente',
  ver: 'Consulta de ficha administrativa',
  eliminar: 'Confirmación de eliminación',
}

export function resolveAdminPageTitle(pathname: string): { title: string; subtitle: string } | null {
  for (const key of Object.keys(ADMIN_MODULES) as AdminModuleKey[]) {
    const mod = ADMIN_MODULES[key]
    const base = mod.basePath

    if (pathname === `${base}/nuevo`) {
      return { title: mod.createTitle, subtitle: CRUD_SUBTITLES.nuevo }
    }
    if (pathname.match(new RegExp(`^${base}/editar/[^/]+$`))) {
      return { title: mod.editTitle, subtitle: CRUD_SUBTITLES.editar }
    }
    if (pathname.match(new RegExp(`^${base}/ver/[^/]+$`))) {
      return { title: mod.detailTitle, subtitle: CRUD_SUBTITLES.ver }
    }
    if (pathname.match(new RegExp(`^${base}/eliminar/[^/]+$`))) {
      return { title: mod.deleteTitle, subtitle: CRUD_SUBTITLES.eliminar }
    }
  }
  return null
}
