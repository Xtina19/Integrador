import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calculator } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { Toolbar } from '../components/ui/Toolbar'
import { products, categories } from '../data/mockData'
import { kardexMovements, locations, inventoryAdjustments, physicalCounts } from '../data/inventoryMockData'

type Tab = 'general' | 'kardex' | 'ubicaciones' | 'ajustes' | 'conteos'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  normal: { label: 'Normal', variant: 'success' },
  low: { label: 'Bajo stock', variant: 'warning' },
  out: { label: 'Agotado', variant: 'danger' },
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'general', label: 'Inventario General' },
  { id: 'kardex', label: 'Kardex' },
  { id: 'ubicaciones', label: 'Ubicaciones' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'conteos', label: 'Conteos Físicos' },
]

export function Inventory() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn.includes(search) ||
        p.author.toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === 'all' || p.category === category
      const matchStatus = status === 'all' || p.status === status
      return matchSearch && matchCategory && matchStatus
    })
  }, [search, category, status])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={Plus} onClick={() => navigate('/inventario/nuevo')}>
            Nuevo Producto
          </Button>
          <Button variant="outline" icon={Plus} onClick={() => navigate('/inventario/ajustes/nuevo')}>
            Nuevo Ajuste
          </Button>
          <Button variant="outline" icon={Calculator} onClick={() => navigate('/inventario/costeo/nuevo')}>
            Nuevo Costeo
          </Button>
        </div>
      </div>

      {activeTab === 'general' && (
        <>
          <Card>
            <CardBody>
              <Toolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por título, ISBN o autor..."
                filters={
                  <>
                    <Select
                      label="Categoría"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      options={[
                        { value: 'all', label: 'Todas' },
                        ...categories.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                    <Select
                      label="Estado"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      options={[
                        { value: 'all', label: 'Todos' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'low', label: 'Bajo stock' },
                        { value: 'out', label: 'Agotado' },
                      ]}
                    />
                  </>
                }
                activeFilters={[
                  ...(category !== 'all' ? [category] : []),
                  ...(status !== 'all' ? [statusMap[status]?.label ?? status] : []),
                ]}
                onExportPdf={() => {}}
                onExportExcel={() => {}}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Stock Consolidado" subtitle={`${filtered.length} productos`} />
            <CardBody className="!p-0">
              <Table
                keyField="id"
                data={filtered}
                columns={[
                  { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono text-gray-500' },
                  {
                    key: 'title',
                    header: 'Título',
                    render: (p) => (
                      <div>
                        <p className="font-medium text-gray-900">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.author}</p>
                      </div>
                    ),
                  },
                  { key: 'category', header: 'Categoría', render: (p) => <Badge variant="neutral">{p.category}</Badge> },
                  { key: 'publisher', header: 'Editorial' },
                  { key: 'stock', header: 'Stock', render: (p) => <span className="font-semibold text-corporate">{p.stock}</span> },
                  {
                    key: 'location',
                    header: 'Ubicación',
                    render: (p) => (
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin size={12} className="text-gold-dark shrink-0" />
                        <span>{p.location}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: (p) => {
                      const s = statusMap[p.status]
                      return <Badge variant={s.variant}>{s.label}</Badge>
                    },
                  },
                ]}
              />
            </CardBody>
          </Card>
        </>
      )}

      {activeTab === 'kardex' && (
        <Card>
          <CardHeader title="Kardex de Movimientos" subtitle="Historial de entradas y salidas" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={kardexMovements}
              columns={[
                { key: 'date', header: 'Fecha', className: 'text-xs whitespace-nowrap' },
                { key: 'product', header: 'Producto', render: (m) => <span className="font-medium">{m.product}</span> },
                { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono' },
                { key: 'type', header: 'Tipo', render: (m) => <Badge variant={m.qty > 0 ? 'success' : 'danger'}>{m.type}</Badge> },
                { key: 'qty', header: 'Cantidad', render: (m) => <span className="font-semibold">{m.qty > 0 ? `+${m.qty}` : m.qty}</span> },
                { key: 'balance', header: 'Saldo' },
                { key: 'reference', header: 'Referencia', className: 'text-xs text-corporate' },
                { key: 'user', header: 'Usuario', className: 'text-xs text-gray-500' },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'ubicaciones' && (
        <Card>
          <CardHeader title="Ubicaciones de Mercancía" subtitle="Almacén, pasillo, estante y sección" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={locations}
              columns={[
                { key: 'product', header: 'Producto', render: (l) => <span className="font-medium">{l.product}</span> },
                { key: 'warehouse', header: 'Almacén' },
                { key: 'aisle', header: 'Pasillo' },
                { key: 'shelf', header: 'Estante' },
                { key: 'section', header: 'Sección' },
                { key: 'qty', header: 'Cantidad', render: (l) => <span className="font-semibold text-corporate">{l.qty}</span> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'ajustes' && (
        <Card>
          <CardHeader title="Ajustes de Inventario" subtitle="Entradas y salidas manuales" action={<Button icon={Plus} size="sm" onClick={() => navigate('/inventario/ajustes/nuevo')}>Nuevo Ajuste</Button>} />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={inventoryAdjustments}
              columns={[
                { key: 'id', header: 'ID', className: 'text-xs font-mono text-corporate' },
                { key: 'date', header: 'Fecha' },
                { key: 'product', header: 'Producto', render: (a) => <span className="font-medium">{a.product}</span> },
                { key: 'type', header: 'Tipo', render: (a) => <Badge variant={a.type === 'Entrada' ? 'success' : 'warning'}>{a.type}</Badge> },
                { key: 'qty', header: 'Cantidad' },
                { key: 'reason', header: 'Motivo', className: 'text-sm' },
                { key: 'user', header: 'Usuario', className: 'text-xs' },
                { key: 'status', header: 'Estado', render: (a) => <Badge variant={a.status === 'approved' ? 'success' : 'warning'}>{a.status === 'approved' ? 'Aprobado' : 'Pendiente'}</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'conteos' && (
        <Card>
          <CardHeader title="Conteos Físicos" subtitle="Auditorías de inventario" action={<Button icon={Plus} size="sm">Nuevo Conteo</Button>} />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={physicalCounts}
              columns={[
                { key: 'id', header: 'ID', className: 'text-xs font-mono' },
                { key: 'date', header: 'Fecha' },
                { key: 'warehouse', header: 'Almacén' },
                { key: 'products', header: 'Productos' },
                { key: 'discrepancies', header: 'Discrepancias', render: (c) => <Badge variant={c.discrepancies > 0 ? 'warning' : 'success'}>{c.discrepancies}</Badge> },
                { key: 'status', header: 'Estado', render: (c) => <Badge variant={c.status === 'completed' ? 'success' : 'info'}>{c.status === 'completed' ? 'Completado' : 'En progreso'}</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
