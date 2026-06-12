import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Transfers } from './pages/Transfers'
import { Publishers } from './pages/Publishers'
import { Events } from './pages/Events'
import { Users } from './pages/Users'

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
      </Route>
    </Routes>
  )
}
