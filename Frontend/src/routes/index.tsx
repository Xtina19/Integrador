import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Inventory } from '@/pages/Inventory'
import { NuevoProductoPage } from '@/pages/inventario/NuevoProductoPage'
import { NuevoAjustePage } from '@/pages/inventario/NuevoAjustePage'
import { NuevoCosteoPage } from '@/pages/inventario/NuevoCosteoPage'
import { Transfers } from '@/pages/Transfers'
import { Events } from '@/pages/Events'
import { NuevoEventoPage } from '@/pages/eventos/NuevoEventoPage'
import { Users } from '@/pages/Users'
import { NuevoUsuarioPage } from '@/pages/usuarios/NuevoUsuarioPage'
import { AdminHome } from '@/pages/admin/AdminHome'
import { AdminProducts } from '@/pages/admin/AdminProducts'
import { AdminCategories } from '@/pages/admin/AdminCategories'
import { AdminBranches } from '@/pages/admin/AdminBranches'
import { AdminSuppliers } from '@/pages/admin/AdminSuppliers'
import { AdminCurrencies } from '@/pages/admin/AdminCurrencies'
import { AdminExchangeRates } from '@/pages/admin/AdminExchangeRates'
import { AdminEditorialesRedirect } from '@/components/admin/AdminEditorialesRedirect'
import { EditorialesLayout } from '@/pages/editoriales/EditorialesLayout'
import { EditorialesDashboard } from '@/pages/editoriales/EditorialesDashboard'
import { EditorialesLista } from '@/pages/editoriales/EditorialesLista'
import { ContratosPage } from '@/pages/editoriales/ContratosPage'
import { RenovacionesPage } from '@/pages/editoriales/RenovacionesPage'
import { CondicionesPage } from '@/pages/editoriales/CondicionesPage'
import { ProductosAsociadosPage } from '@/pages/editoriales/ProductosAsociadosPage'
import { VentasLayout } from '@/pages/ventas/VentasLayout'
import { VentasDashboard } from '@/pages/ventas/VentasDashboard'
import { POSPage } from '@/pages/ventas/POSPage'
import { HistorialVentasPage } from '@/pages/ventas/HistorialVentasPage'
import { CambiosNotasCreditoPage } from '@/pages/ventas/CambiosNotasCreditoPage'
import { ProductFormPage, ProductDetailPage, ProductDeletePage } from '@/pages/admin/crud/ProductCrud'
import { CategoryFormPage, CategoryDetailPage, CategoryDeletePage } from '@/pages/admin/crud/CategoryCrud'
import { PublisherFormPage, PublisherDetailPage, PublisherDeletePage } from '@/pages/admin/crud/PublisherCrud'
import { BranchFormPage, BranchDetailPage, BranchDeletePage } from '@/pages/admin/crud/BranchCrud'
import { SupplierFormPage, SupplierDetailPage, SupplierDeletePage } from '@/pages/admin/crud/SupplierCrud'
import { CurrencyFormPage, CurrencyDetailPage, CurrencyDeletePage } from '@/pages/admin/crud/CurrencyCrud'
import { ExchangeRateFormPage, ExchangeRateDetailPage, ExchangeRateDeletePage } from '@/pages/admin/crud/ExchangeRateCrud'
import { ReportesLayout } from '@/pages/reportes/ReportesLayout'
import { ReportesHub } from '@/pages/reportes/ReportesHub'
import { ReporteInventarioPage } from '@/pages/reportes/ReporteInventarioPage'
import { ReporteVentasPage } from '@/pages/reportes/ReporteVentasPage'
import { ReporteComprasPage } from '@/pages/reportes/ReporteComprasPage'
import { ReporteEditorialesPage } from '@/pages/reportes/ReporteEditorialesPage'
import { ReporteEventosPage } from '@/pages/reportes/ReporteEventosPage'
import { ReporteImportacionesPage } from '@/pages/reportes/ReporteImportacionesPage'
import { AuditoriaLayout } from '@/pages/auditoria/AuditoriaLayout'
import { ActividadesPage } from '@/pages/auditoria/ActividadesPage'
import { CambiosPage } from '@/pages/auditoria/CambiosPage'
import { AccesosPage } from '@/pages/auditoria/AccesosPage'
import { EliminacionesPage } from '@/pages/auditoria/EliminacionesPage'
import { ConfiguracionLayout } from '@/pages/configuracion/ConfiguracionLayout'
import { ConfiguracionGeneralPage } from '@/pages/configuracion/ConfiguracionGeneralPage'
import { NotificacionesPage } from '@/pages/configuracion/NotificacionesPage'
import { CorreosPage } from '@/pages/configuracion/CorreosPage'
import { AyudaPage } from '@/pages/ayuda/AyudaPage'
import { ComprasLayout } from '@/pages/compras/ComprasLayout'
import { ComprasDashboard } from '@/pages/compras/ComprasDashboard'
import { OrdenesCompraPage } from '@/pages/compras/OrdenesCompraPage'
import { NuevaOrdenCompraPage } from '@/pages/compras/NuevaOrdenCompraPage'
import { RecepcionesPage } from '@/pages/compras/RecepcionesPage'
import { FacturasProveedoresPage } from '@/pages/compras/FacturasProveedoresPage'
import { ImportacionesLayout } from '@/pages/importaciones/ImportacionesLayout'
import { ImportacionesDashboard } from '@/pages/importaciones/ImportacionesDashboard'
import { EmbarquesPage } from '@/pages/importaciones/EmbarquesPage'
import { RegistrarEmbarquePage } from '@/pages/importaciones/RegistrarEmbarquePage'
import { FacturasInternacionalesPage } from '@/pages/importaciones/FacturasInternacionalesPage'
import { ConsolidacionesPage } from '@/pages/importaciones/ConsolidacionesPage'
import { CostosFletePage } from '@/pages/importaciones/CostosFletePage'
import { CosteoLibroPage } from '@/pages/importaciones/CosteoLibroPage'
import { PalletsCajasPage } from '@/pages/importaciones/PalletsCajasPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="inventario/nuevo" element={<NuevoProductoPage />} />
        <Route path="inventario/ajustes/nuevo" element={<NuevoAjustePage />} />
        <Route path="inventario/costeo/nuevo" element={<NuevoCosteoPage />} />
        <Route path="transferencias" element={<Transfers />} />
        <Route path="editoriales" element={<EditorialesLayout />}>
          <Route index element={<EditorialesDashboard />} />
          <Route path="lista" element={<EditorialesLista />} />
          <Route path="contratos" element={<ContratosPage />} />
          <Route path="renovaciones" element={<RenovacionesPage />} />
          <Route path="condiciones" element={<CondicionesPage />} />
          <Route path="productos" element={<ProductosAsociadosPage />} />
        </Route>
        <Route path="editoriales/nuevo" element={<PublisherFormPage />} />
        <Route path="editoriales/editar/:id" element={<PublisherFormPage />} />
        <Route path="editoriales/ver/:id" element={<PublisherDetailPage />} />
        <Route path="editoriales/eliminar/:id" element={<PublisherDeletePage />} />
        <Route path="eventos" element={<Events />} />
        <Route path="eventos/nuevo" element={<NuevoEventoPage />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="usuarios/nuevo" element={<NuevoUsuarioPage />} />

        <Route path="ventas" element={<VentasLayout />}>
          <Route index element={<VentasDashboard />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="historial" element={<HistorialVentasPage />} />
          <Route path="cambios-notas" element={<CambiosNotasCreditoPage />} />
        </Route>

        <Route path="compras" element={<ComprasLayout />}>
          <Route index element={<ComprasDashboard />} />
          <Route path="ordenes" element={<OrdenesCompraPage />} />
          <Route path="recepciones" element={<RecepcionesPage />} />
          <Route path="facturas" element={<FacturasProveedoresPage />} />
        </Route>
        <Route path="compras/ordenes/nuevo" element={<NuevaOrdenCompraPage />} />

        <Route path="importaciones" element={<ImportacionesLayout />}>
          <Route index element={<ImportacionesDashboard />} />
          <Route path="embarques" element={<EmbarquesPage />} />
          <Route path="facturas" element={<FacturasInternacionalesPage />} />
          <Route path="consolidaciones" element={<ConsolidacionesPage />} />
          <Route path="costos" element={<CostosFletePage />} />
          <Route path="costeo" element={<CosteoLibroPage />} />
          <Route path="pallets" element={<PalletsCajasPage />} />
        </Route>
        <Route path="importaciones/embarques/nuevo" element={<RegistrarEmbarquePage />} />

        <Route path="administracion" element={<AdminHome />} />

        <Route path="administracion/productos" element={<AdminProducts />} />
        <Route path="administracion/productos/nuevo" element={<ProductFormPage />} />
        <Route path="administracion/productos/editar/:id" element={<ProductFormPage />} />
        <Route path="administracion/productos/ver/:id" element={<ProductDetailPage />} />
        <Route path="administracion/productos/eliminar/:id" element={<ProductDeletePage />} />

        <Route path="administracion/categorias" element={<AdminCategories />} />
        <Route path="administracion/categorias/nuevo" element={<CategoryFormPage />} />
        <Route path="administracion/categorias/editar/:id" element={<CategoryFormPage />} />
        <Route path="administracion/categorias/ver/:id" element={<CategoryDetailPage />} />
        <Route path="administracion/categorias/eliminar/:id" element={<CategoryDeletePage />} />

        <Route path="administracion/editoriales/*" element={<AdminEditorialesRedirect />} />

        <Route path="administracion/sucursales" element={<AdminBranches />} />
        <Route path="administracion/sucursales/nuevo" element={<BranchFormPage />} />
        <Route path="administracion/sucursales/editar/:id" element={<BranchFormPage />} />
        <Route path="administracion/sucursales/ver/:id" element={<BranchDetailPage />} />
        <Route path="administracion/sucursales/eliminar/:id" element={<BranchDeletePage />} />

        <Route path="administracion/proveedores" element={<AdminSuppliers />} />
        <Route path="administracion/proveedores/nuevo" element={<SupplierFormPage />} />
        <Route path="administracion/proveedores/editar/:id" element={<SupplierFormPage />} />
        <Route path="administracion/proveedores/ver/:id" element={<SupplierDetailPage />} />
        <Route path="administracion/proveedores/eliminar/:id" element={<SupplierDeletePage />} />

        <Route path="administracion/monedas" element={<AdminCurrencies />} />
        <Route path="administracion/monedas/nuevo" element={<CurrencyFormPage />} />
        <Route path="administracion/monedas/editar/:id" element={<CurrencyFormPage />} />
        <Route path="administracion/monedas/ver/:id" element={<CurrencyDetailPage />} />
        <Route path="administracion/monedas/eliminar/:id" element={<CurrencyDeletePage />} />

        <Route path="administracion/tasas-cambio" element={<AdminExchangeRates />} />
        <Route path="administracion/tasas-cambio/nuevo" element={<ExchangeRateFormPage />} />
        <Route path="administracion/tasas-cambio/editar/:id" element={<ExchangeRateFormPage />} />
        <Route path="administracion/tasas-cambio/ver/:id" element={<ExchangeRateDetailPage />} />
        <Route path="administracion/tasas-cambio/eliminar/:id" element={<ExchangeRateDeletePage />} />

        <Route path="reportes" element={<ReportesLayout />}>
          <Route index element={<ReportesHub />} />
          <Route path="inventario" element={<ReporteInventarioPage />} />
          <Route path="ventas" element={<ReporteVentasPage />} />
          <Route path="compras" element={<ReporteComprasPage />} />
          <Route path="editoriales" element={<ReporteEditorialesPage />} />
          <Route path="eventos" element={<ReporteEventosPage />} />
          <Route path="importaciones" element={<ReporteImportacionesPage />} />
        </Route>

        <Route path="auditoria" element={<AuditoriaLayout />}>
          <Route index element={<ActividadesPage />} />
          <Route path="cambios" element={<CambiosPage />} />
          <Route path="accesos" element={<AccesosPage />} />
          <Route path="eliminaciones" element={<EliminacionesPage />} />
        </Route>

        <Route path="configuracion" element={<ConfiguracionLayout />}>
          <Route index element={<ConfiguracionGeneralPage />} />
          <Route path="notificaciones" element={<NotificacionesPage />} />
          <Route path="correos" element={<CorreosPage />} />
        </Route>

        <Route path="ayuda" element={<AyudaPage />} />
      </Route>
    </Routes>
  )
}
