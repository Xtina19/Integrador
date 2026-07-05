import { Navigate, useLocation } from 'react-router-dom'

/** Redirige rutas legacy /administracion/editoriales/* hacia /editoriales/* */
export function AdminEditorialesRedirect() {
  const location = useLocation()
  const suffix = location.pathname.replace(/^\/administracion\/editoriales/, '') || ''
  return <Navigate to={`/editoriales${suffix}${location.search}`} replace />
}
