import { useState, useMemo } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminProducts } from '../../data/adminMockData'
import { categories } from '../../data/mockData'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

const publisherNames = [...new Set(adminProducts.map((p) => p.publisher))]

export function AdminProducts() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [publisher, setPublisher] = useState('all')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return adminProducts.filter((p) => {
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn.includes(search) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === 'all' || p.category === category
      const matchPublisher = publisher === 'all' || p.publisher === publisher
      const matchStatus = status === 'all' || p.status === status
      return matchSearch && matchCategory && matchPublisher && matchStatus
    })
  }, [search, category, publisher, status])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Productos</span>
          <span className="ml-2">— {filtered.length} de {adminProducts.length} registros</span>
        </div>
        <Button icon={Plus}>Crear Producto</Button>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                icon={Search}
                placeholder="Buscar por código, ISBN o título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las categorías' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
            <Select
              label="Editorial"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las editoriales' },
                ...publisherNames.map((p) => ({ value: p, label: p })),
              ]}
            />
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'active', label: 'Activo' },
                { value: 'inactive', label: 'Inactivo' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">Filtros activos:</span>
            {category !== 'all' && <Badge variant="gold">{category}</Badge>}
            {publisher !== 'all' && <Badge variant="gold">{publisher}</Badge>}
            {status !== 'all' && <Badge variant="gold">{statusMap[status]?.label}</Badge>}
            {search && <Badge variant="gold">"{search}"</Badge>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catálogo Maestro de Productos" subtitle="Mantenimiento de productos del sistema" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código Interno', render: (p) => <span className="font-mono text-xs font-medium text-corporate">{p.code}</span> },
              { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono text-gray-500' },
              { key: 'title', header: 'Título', render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
              { key: 'category', header: 'Categoría', render: (p) => <Badge variant="neutral">{p.category}</Badge> },
              { key: 'publisher', header: 'Editorial' },
              {
                key: 'price',
                header: 'Precio',
                render: (p) => <span className="font-semibold text-corporate">${p.price.toLocaleString()}</span>,
              },
              { key: 'currency', header: 'Moneda', render: (p) => <Badge variant="gold">{p.currency}</Badge> },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => {
                  const s = statusMap[p.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
