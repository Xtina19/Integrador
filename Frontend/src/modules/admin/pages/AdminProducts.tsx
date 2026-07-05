import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { categoryNames, publisherNames, currencyCodes } from '@/mocks/mockAdmin'
import { adminPath } from '@/lib/adminConfig'
import { useAdminCatalog } from '@/context/AdminCatalogContext'
import { validateAdminProduct } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export function AdminProducts() {
  const navigate = useNavigate()
  const { products, updateProduct, deleteProduct } = useAdminCatalog()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [publisher, setPublisher] = useState('all')
  const [status, setStatus] = useState('all')
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    isbn: '',
    title: '',
    author: '',
    category: '',
    publisher: '',
    price: '',
    currency: 'DOP',
    status: 'active',
  })

  const selected = dialog ? products.find((p) => p.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        code: selected.code,
        isbn: selected.isbn,
        title: selected.title,
        author: selected.author,
        category: selected.category,
        publisher: selected.publisher,
        price: String(selected.price),
        currency: selected.currency,
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const filtered = useMemo(() => {
    return products.filter((p) => {
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
  }, [products, search, category, publisher, status])

  const validation = useMemo(
    () =>
      validateAdminProduct(
        form,
        products.map((p) => p.code),
        products.map((p) => p.isbn),
        selected?.code,
        selected?.isbn
      ),
    [form, products, selected]
  )

  function handleSave() {
    if (!selected || !validation.valid) return false
    updateProduct(selected.id, {
      code: trim(form.code),
      isbn: trim(form.isbn),
      title: trim(form.title),
      author: trim(form.author),
      category: form.category,
      publisher: form.publisher,
      price: Number(form.price) || 0,
      currency: form.currency,
      status: form.status as 'active' | 'inactive',
    })
    setDialog(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Productos</span>
          <span className="ml-2">— {filtered.length} de {products.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('productos', 'nuevo'))}>
          Crear Producto
        </Button>
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
                ...categoryNames.map((c) => ({ value: c, label: c })),
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
                render: (p) => <span className="font-semibold text-corporate">RD${p.price.toLocaleString()}</span>,
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
                render: (p) => (
                  <TableActions
                    onView={() => setDialog({ id: p.id, mode: 'view' })}
                    onEdit={() => setDialog({ id: p.id, mode: 'edit' })}
                    onDelete={() => setDeleteId(p.id)}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Editar Producto' : 'Detalle de Producto'}
        subtitle={selected?.code}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Código Interno" value={<span className="font-mono text-corporate">{selected.code}</span>} />
            <DetailRow label="ISBN" value={<span className="font-mono">{selected.isbn}</span>} />
            <DetailRow label="Título" value={selected.title} />
            <DetailRow label="Autor" value={selected.author} />
            <DetailRow label="Categoría" value={<Badge variant="neutral">{selected.category}</Badge>} />
            <DetailRow label="Editorial" value={selected.publisher} />
            <DetailRow label="Precio" value={<span className="font-semibold text-corporate">RD${selected.price.toLocaleString()}</span>} />
            <DetailRow label="Moneda" value={<Badge variant="gold">{selected.currency}</Badge>} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.status].variant}>{statusMap[selected.status].label}</Badge>} />
          </>
        ) : selected ? (
          <>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Código Interno" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="md:col-span-2" />
            <Input label="Autor" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="md:col-span-2" />
            <Select label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categoryNames.map((c) => ({ value: c, label: c }))} />
            <Select label="Editorial" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} options={publisherNames.map((p) => ({ value: p, label: p }))} />
            <Input label="Precio" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Select label="Moneda" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={currencyCodes.map((c) => ({ value: c, label: c }))} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
          </>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deleteProduct(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar este producto del catálogo maestro?"
      />
    </div>
  )
}
