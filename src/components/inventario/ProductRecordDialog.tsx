import { useEffect, useMemo, useState } from 'react'
import type { Product } from '../../types/domain'
import { FormDialog, DetailRow } from '../ui/FormDialog'
import { Input, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { categories } from '../../data/mockData'
import { publisherNames } from '../../data/adminMockData'
import { validateProduct } from '../../business-rules/validators'
import { trim } from '../../utils/formValidation'
import { useERP } from '../../store/ERPProvider'

interface ProductRecordDialogProps {
  product: Product | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  normal: { label: 'Normal', variant: 'success' },
  low: { label: 'Bajo stock', variant: 'warning' },
  out: { label: 'Agotado', variant: 'danger' },
}

export function ProductRecordDialog({ product, mode, open, onClose, onEdit }: ProductRecordDialogProps) {
  const { state, updateProduct } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    isbn: '',
    name: '',
    category: '',
    publisher: '',
    stock: '',
    minStock: '',
    location: '',
    cost: '',
    price: '',
  })

  useEffect(() => {
    if (!product) return
    setForm({
      isbn: product.isbn,
      name: product.title,
      category: product.category,
      publisher: product.publisher,
      stock: String(product.stock),
      minStock: String(product.minStock ?? 10),
      location: product.location,
      cost: String(product.cost ?? 0),
      price: String(product.price ?? 0),
    })
    setError('')
  }, [product, mode, open])

  const validation = useMemo(
    () =>
      product && mode === 'edit'
        ? validateProduct(
            { code: product.id, ...form },
            state.products.map((p) => p.id),
            state.products.map((p) => p.isbn),
            product.id,
            product.isbn
          )
        : { valid: true, errors: [] },
    [form, mode, product, state.products]
  )

  if (!product) return null

  function handleSave() {
    const result = updateProduct({
      productId: product!.id,
      code: product!.id,
      isbn: trim(form.isbn),
      name: trim(form.name),
      category: form.category,
      publisher: form.publisher,
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0,
      location: trim(form.location),
      cost: Number(form.cost) || 0,
      price: Number(form.price) || 0,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    onClose()
  }

  const st = statusMap[product.status]

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Detalle de Producto' : 'Editar Producto'}
      subtitle={product.title}
      mode={mode}
      onEdit={onEdit}
      onSave={handleSave}
      saveDisabled={mode === 'edit' && !validation.valid}
      maxWidth="3xl"
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>
      )}

      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Código" value={<span className="font-mono">{product.id}</span>} />
          <DetailRow label="ISBN" value={<span className="font-mono">{product.isbn}</span>} />
          <DetailRow label="Título" value={product.title} />
          <DetailRow label="Autor" value={product.author || '—'} />
          <DetailRow label="Categoría" value={<Badge variant="neutral">{product.category}</Badge>} />
          <DetailRow label="Editorial" value={product.publisher} />
          <DetailRow label="Stock" value={<span className="font-semibold text-corporate">{product.stock}</span>} />
          <DetailRow label="Stock mínimo" value={product.minStock ?? '—'} />
          <DetailRow label="Ubicación" value={product.location} />
          <DetailRow label="Costo" value={`RD$${(product.cost ?? 0).toLocaleString()}`} />
          <DetailRow label="Precio" value={`RD$${(product.price ?? 0).toLocaleString()}`} />
          <DetailRow label="Estado" value={<Badge variant={st.variant}>{st.label}</Badge>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Código" value={product.id} disabled />
          <Input label="ISBN *" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <Select label="Categoría *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
          <Select label="Editorial *" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} options={publisherNames.map((p) => ({ value: p, label: p }))} />
          <Input label="Stock *" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <Input label="Stock mínimo *" type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          <Input label="Ubicación *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="md:col-span-2" />
          <Input label="Costo *" type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          <Input label="Precio *" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
      )}
    </FormDialog>
  )
}
