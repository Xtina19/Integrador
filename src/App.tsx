import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Transfers } from './pages/Transfers'
import { Events } from './pages/Events'
import { Users } from './pages/Users'
import { AdminHome } from './pages/admin/AdminHome'
import { Editoriales } from './pages/admin/Editoriales'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminCategories } from './pages/admin/AdminCategories'
import { AdminBranches } from './pages/admin/AdminBranches'
import { AdminSuppliers } from './pages/admin/AdminSuppliers'
import { AdminCurrencies } from './pages/admin/AdminCurrencies'
import { AdminExchangeRates } from './pages/admin/AdminExchangeRates'
import { EditorialesLegacyRedirect } from './components/admin/EditorialesLegacyRedirect'
import { ProductFormPage, ProductDetailPage, ProductDeletePage } from './pages/admin/crud/ProductCrud'
import { CategoryFormPage, CategoryDetailPage, CategoryDeletePage } from './pages/admin/crud/CategoryCrud'
import { PublisherFormPage, PublisherDetailPage, PublisherDeletePage } from './pages/admin/crud/PublisherCrud'
import { BranchFormPage, BranchDetailPage, BranchDeletePage } from './pages/admin/crud/BranchCrud'
import { SupplierFormPage, SupplierDetailPage, SupplierDeletePage } from './pages/admin/crud/SupplierCrud'
import { CurrencyFormPage, CurrencyDetailPage, CurrencyDeletePage } from './pages/admin/crud/CurrencyCrud'
import { ExchangeRateFormPage, ExchangeRateDetailPage, ExchangeRateDeletePage } from './pages/admin/crud/ExchangeRateCrud'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="transferencias" element={<Transfers />} />
        <Route path="eventos" element={<Events />} />
        <Route path="usuarios" element={<Users />} />

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

        <Route path="administracion/editoriales" element={<Editoriales />} />
        <Route path="administracion/editoriales/nuevo" element={<PublisherFormPage />} />
        <Route path="administracion/editoriales/editar/:id" element={<PublisherFormPage />} />
        <Route path="administracion/editoriales/ver/:id" element={<PublisherDetailPage />} />
        <Route path="administracion/editoriales/eliminar/:id" element={<PublisherDeletePage />} />

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

        {/* Redirección legacy: /editoriales → /administracion/editoriales */}
        <Route path="editoriales/*" element={<EditorialesLegacyRedirect />} />
      </Route>
    </Routes>
  )
}
