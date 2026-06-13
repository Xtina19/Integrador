import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Transfers } from './pages/Transfers'
import { Publishers } from './pages/Publishers'
import { Events } from './pages/Events'
import { Users } from './pages/Users'
import { AdminHome } from './pages/admin/AdminHome'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminCategories } from './pages/admin/AdminCategories'
import { AdminPublishers } from './pages/admin/AdminPublishers'
import { AdminBranches } from './pages/admin/AdminBranches'
import { AdminSuppliers } from './pages/admin/AdminSuppliers'
import { AdminCurrencies } from './pages/admin/AdminCurrencies'
import { AdminExchangeRates } from './pages/admin/AdminExchangeRates'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="transferencias" element={<Transfers />} />
        <Route path="editoriales" element={<Publishers />} />
        <Route path="eventos" element={<Events />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="administracion" element={<AdminHome />} />
        <Route path="administracion/productos" element={<AdminProducts />} />
        <Route path="administracion/categorias" element={<AdminCategories />} />
        <Route path="administracion/editoriales" element={<AdminPublishers />} />
        <Route path="administracion/sucursales" element={<AdminBranches />} />
        <Route path="administracion/proveedores" element={<AdminSuppliers />} />
        <Route path="administracion/monedas" element={<AdminCurrencies />} />
        <Route path="administracion/tasas-cambio" element={<AdminExchangeRates />} />
      </Route>
    </Routes>
  )
}
