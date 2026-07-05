import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calculator } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProductRecordDialog } from '@/modules/inventario/components/ProductRecordDialog'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { categories } from '@/mocks/mockCore'
import { locations, physicalCounts } from '@/mocks/mockInventario'
import type { Product, KardexMovement, InventoryAdjustment } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { useToast } from '@/context/ToastContext'
import { useTableExport } from '@/hooks/useTableExport'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '@/context/GlobalSearchNavigationContext'

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
  const { state, deleteProduct } = useERP()
  const { showSuccess } = useToast()
  const { onExportPdf, onExportExcel } = useTableExport('Inventario')
  const products = state.products
  const kardexMovements = state.kardexMovements
  const inventoryAdjustments = state.inventoryAdjustments
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [productDialog, setProductDialog] = useState<{ productId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [countDialogOpen, setCountDialogOpen] = useState(false)

  const selectedProduct = productDialog ? products.find((p) => p.id === productDialog.productId) ?? null : null

  useGlobalSearchRecordEffect('product', {
    onHighlight: (recordId) => {
      setActiveTab('general')
      setHighlightId(recordId)
    },
  })
  useRecordHighlightScroll(highlightId)

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
                onExportPdf={onExportPdf}
                onExportExcel={() =>
                  onExportExcel(
                    ['ISBN', 'Título', 'Autor', 'Categoría', 'Stock', 'Ubicación', 'Estado'],
                    filtered.map((p) => [p.isbn, p.title, p.author, p.category, String(p.stock), p.location, p.status])
                  )
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Stock Consolidado" subtitle={`${filtered.length} productos`} />
            <CardBody className="!p-0">
              <Table
                keyField="id"
                highlightId={highlightId}
                data={filtered as (Product & Record<string, unknown>)[]}
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
                  {
                    key: 'actions',
                    header: 'Acciones',
                    render: (p) => (
                      <TableActions
                        onView={() => setProductDialog({ productId: p.id, mode: 'view' })}
                        onEdit={() => setProductDialog({ productId: p.id, mode: 'edit' })}
                        onDelete={() => setDeleteProductId(p.id)}
                      />
                    ),
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
              data={kardexMovements as (KardexMovement & Record<string, unknown>)[]}
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
              data={inventoryAdjustments as (InventoryAdjustment & Record<string, unknown>)[]}
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
          <CardHeader title="Conteos Físicos" subtitle="Auditorías de inventario" action={<Button icon={Plus} size="sm" onClick={() => setCountDialogOpen(true)}>Nuevo Conteo</Button>} />
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
      <ProductRecordDialog
        product={selectedProduct}
        mode={productDialog?.mode ?? 'view'}
        open={Boolean(productDialog && selectedProduct)}
        onClose={() => setProductDialog(null)}
        onEdit={() => setProductDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
      />
      <ConfirmDialog
        open={Boolean(deleteProductId)}
        onClose={() => setDeleteProductId(null)}
        onConfirm={() => {
          if (!deleteProductId) return
          const result = deleteProduct(deleteProductId)
          if (result.success) showSuccess('Producto eliminado correctamente')
          setDeleteProductId(null)
        }}
        message="¿Está seguro de eliminar este producto del inventario?"
      />
      <FormDialog
        open={countDialogOpen}
        onClose={() => setCountDialogOpen(false)}
        title="Nuevo Conteo Físico"
        subtitle="Programación de auditoría de inventario"
        mode="edit"
        onSave={() => {
          showSuccess('Conteo físico programado correctamente')
          setCountDialogOpen(false)
        }}
        saveLabel="Programar conteo"
      >
        <div className="space-y-4">
          <DetailRow label="Almacén" value="Almacén Central" />
          <DetailRow label="Fecha programada" value={new Date().toISOString().slice(0, 10)} />
          <DetailRow label="Productos a contar" value={products.length} />
          <DetailRow label="Estado" value={<Badge variant="info">Programado</Badge>} />
          <p className="text-sm text-gray-500">El conteo quedará registrado como &quot;En progreso&quot; en la tabla de conteos físicos.</p>
        </div>
      </FormDialog>
    </div>
  )
}
