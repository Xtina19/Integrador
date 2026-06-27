import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { resolveAdminPageTitle } from '../../lib/adminPageTitles'
import { ImportacionesSearchProvider } from '../../context/ImportacionesSearchContext'
import { GlobalSearchNavigationProvider } from '../../context/GlobalSearchNavigationContext'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Resumen general del sistema' },
  '/inventario': { title: 'Gestión de Inventario', subtitle: 'Control de productos y stock' },
  '/inventario/nuevo': { title: 'Nuevo Producto', subtitle: 'Registro en inventario' },
  '/inventario/ajustes/nuevo': { title: 'Nuevo Ajuste', subtitle: 'Ajuste de inventario' },
  '/inventario/costeo/nuevo': { title: 'Nuevo Costeo', subtitle: 'Actualización de costo' },
  '/ventas': { title: 'Ventas', subtitle: 'Dashboard de ventas y punto de venta' },
  '/ventas/pos': { title: 'Punto de Venta', subtitle: 'POS — Cobro y facturación' },
  '/ventas/historial': { title: 'Historial de Ventas', subtitle: 'Facturas y transacciones' },
  '/ventas/devoluciones': { title: 'Devoluciones', subtitle: 'Gestión de devoluciones' },
  '/compras': { title: 'Compras', subtitle: 'Órdenes de compra y recepciones' },
  '/importaciones': { title: 'Importaciones', subtitle: 'Embarques y costeo internacional' },
  '/transferencias': { title: 'Transferencias', subtitle: 'Movimientos entre sucursales' },
  '/editoriales': { title: 'Editoriales', subtitle: 'Dashboard editorial y contratos' },
  '/editoriales/lista': { title: 'Editoriales', subtitle: 'Catálogo de editoriales' },
  '/editoriales/contratos': { title: 'Contratos', subtitle: 'Contratos editoriales vigentes' },
  '/editoriales/renovaciones': { title: 'Renovaciones', subtitle: 'Historial de renovaciones' },
  '/editoriales/condiciones': { title: 'Condiciones Comerciales', subtitle: 'Descuentos y crédito' },
  '/editoriales/productos': { title: 'Productos Asociados', subtitle: 'Libros por editorial' },
  '/eventos': { title: 'Eventos y Ferias', subtitle: 'Calendario y reservaciones' },
  '/eventos/nuevo': { title: 'Nuevo Evento', subtitle: 'Asignación inteligente de personal' },
  '/reportes': { title: 'Reportes', subtitle: 'Informes y exportaciones' },
  '/usuarios': { title: 'Usuarios y Permisos', subtitle: 'Roles, accesos y seguridad' },
  '/usuarios/nuevo': { title: 'Nuevo Usuario', subtitle: 'Alta de usuario del sistema' },
  '/auditoria': { title: 'Auditoría', subtitle: 'Trazabilidad del sistema' },
  '/configuracion': { title: 'Configuración', subtitle: 'Parámetros del sistema' },
  '/ayuda': { title: 'Ayuda', subtitle: 'Manual, FAQ y soporte' },
  '/administracion': { title: 'Administración General', subtitle: 'Gestión de Catálogos Maestros' },
  '/administracion/productos': { title: 'Productos', subtitle: 'Catálogo maestro de productos' },
  '/administracion/categorias': { title: 'Categorías', subtitle: 'Clasificación de productos' },
  '/administracion/sucursales': { title: 'Sucursales', subtitle: 'Puntos de venta y almacén central' },
  '/administracion/proveedores': { title: 'Proveedores', subtitle: 'Proveedores y distribuidores' },
  '/administracion/monedas': { title: 'Monedas', subtitle: 'Monedas habilitadas en el sistema' },
  '/administracion/tasas-cambio': { title: 'Tasas de Cambio', subtitle: 'Tipos de cambio y historial' },
}

const prefixTitles: { prefix: string; title: string; subtitle: string }[] = [
  { prefix: '/compras/ordenes/nuevo', title: 'Nueva Orden de Compra', subtitle: 'Registro de orden' },
  { prefix: '/importaciones/embarques/nuevo', title: 'Registrar Embarque', subtitle: 'Nuevo embarque internacional' },
  { prefix: '/compras/', title: 'Compras', subtitle: 'Gestión de compras' },
  { prefix: '/importaciones/', title: 'Importaciones', subtitle: 'Gestión de importaciones' },
  { prefix: '/reportes/', title: 'Reportes', subtitle: 'Informes del sistema' },
  { prefix: '/auditoria/', title: 'Auditoría', subtitle: 'Trazabilidad' },
  { prefix: '/configuracion/', title: 'Configuración', subtitle: 'Parámetros' },
]

function getPageInfo(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const admin = resolveAdminPageTitle(pathname)
  if (admin) return admin
  const prefix = prefixTitles.find((p) => pathname.startsWith(p.prefix))
  if (prefix) return { title: prefix.title, subtitle: prefix.subtitle }
  return { title: 'LibroSys', subtitle: '' }
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const page = getPageInfo(location.pathname)

  return (
    <ImportacionesSearchProvider>
      <GlobalSearchNavigationProvider>
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
      </GlobalSearchNavigationProvider>
    </ImportacionesSearchProvider>
  )
}
