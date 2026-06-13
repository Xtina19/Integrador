import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
  '/inventario': { title: 'Gestión de Inventario', subtitle: 'Control de productos y stock' },
  '/transferencias': { title: 'Transferencias', subtitle: 'Movimientos entre sucursales' },
  '/editoriales': { title: 'Gestión de Editoriales', subtitle: 'Contratos y proveedores editoriales' },
  '/eventos': { title: 'Eventos y Ferias', subtitle: 'Calendario y reservaciones' },
  '/usuarios': { title: 'Usuarios y Permisos', subtitle: 'Roles, accesos y auditoría' },
  '/administracion': { title: 'Administración General', subtitle: 'Gestión de Catálogos Maestros' },
  '/administracion/productos': { title: 'Productos', subtitle: 'Catálogo maestro de productos' },
  '/administracion/categorias': { title: 'Categorías', subtitle: 'Clasificación de productos' },
  '/administracion/editoriales': { title: 'Editoriales', subtitle: 'Catálogo maestro de editoriales' },
  '/administracion/sucursales': { title: 'Sucursales', subtitle: 'Puntos de venta y almacén central' },
  '/administracion/proveedores': { title: 'Proveedores', subtitle: 'Proveedores y distribuidores' },
  '/administracion/monedas': { title: 'Monedas', subtitle: 'Monedas habilitadas en el sistema' },
  '/administracion/tasas-cambio': { title: 'Tasas de Cambio', subtitle: 'Tipos de cambio y historial' },
}

function getPageInfo(pathname: string) {
  return pageTitles[pathname] ?? { title: 'LibroSys', subtitle: '' }
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const page = getPageInfo(location.pathname)

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header title={page.title} subtitle={page.subtitle} sidebarCollapsed={collapsed} />
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          collapsed ? 'pl-[72px]' : 'pl-64'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
