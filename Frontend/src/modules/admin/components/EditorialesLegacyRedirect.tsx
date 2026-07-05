import { Navigate, useLocation } from 'react-router-dom'

/** Redirige rutas legacy /editoriales/* hacia /administracion/editoriales/* */
export function EditorialesLegacyRedirect() {
  const location = useLocation()
  const suffix = location.pathname.replace(/^\/editoriales/, '') || ''
  return <Navigate to={`/administracion/editoriales${suffix}${location.search}`} replace />
}
