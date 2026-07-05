import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { posProducts } from '@/mocks/mockVentas'
import { branches } from '@/mocks/mockCore'
import type { EventInventoryItem } from '@/modules/eventos/types/eventExtended'

interface EventInventoryTabContentProps {
  items: EventInventoryItem[]
  onChange: (items: EventInventoryItem[]) => void
  readOnly?: boolean
}

export function EventInventoryTabContent({ items, onChange, readOnly = false }: EventInventoryTabContentProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productId, setProductId] = useState(posProducts[0]?.id ?? '')
  const [qty, setQty] = useState('1')
  const [originBranch, setOriginBranch] = useState(branches[0]?.name ?? '')

  const selectedProduct = posProducts.find((p) => p.id === productId)

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setProductId(posProducts[0]?.id ?? '')
    setQty('1')
    setOriginBranch(branches[0]?.name ?? '')
  }

  function handleSave() {
    if (!selectedProduct) return
    const numQty = Math.max(1, Number(qty) || 1)
    if (editingId) {
      onChange(
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                product: selectedProduct.title,
                code: selectedProduct.id,
                isbn: selectedProduct.isbn,
                qty: numQty,
                originBranch,
              }
            : item
        )
      )
    } else {
      onChange([
        ...items,
        {
          id: `EI-${Date.now()}`,
          product: selectedProduct.title,
          code: selectedProduct.id,
          isbn: selectedProduct.isbn,
          qty: numQty,
          originBranch,
        },
      ])
    }
    resetForm()
  }

  function startEdit(item: EventInventoryItem) {
    setEditingId(item.id)
    setProductId(item.code)
    setQty(String(item.qty))
    setOriginBranch(item.originBranch)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Inventario destinado al evento</h4>
          <p className="text-xs text-gray-500 mt-0.5">Productos que serán enviados a la feria (datos simulados)</p>
        </div>
        {!readOnly && (
          <Button size="sm" icon={Plus} onClick={() => { resetForm(); setShowForm(true) }}>
            Agregar producto
          </Button>
        )}
      </div>

      {showForm && !readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-surface border border-gray-100">
          <Select
            label="Producto"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            options={posProducts.map((p) => ({ value: p.id, label: p.title }))}
            className="md:col-span-2"
          />
          <Input label="Cantidad" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          <Select
            label="Sucursal origen"
            value={originBranch}
            onChange={(e) => setOriginBranch(e.target.value)}
            options={branches.map((b) => ({ value: b.name, label: b.name }))}
          />
          <div className="md:col-span-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>{editingId ? 'Actualizar' : 'Agregar'}</Button>
          </div>
        </div>
      )}

      <Table
        keyField="id"
        data={items as (EventInventoryItem & Record<string, unknown>)[]}
        columns={[
          { key: 'product', header: 'Producto', render: (r) => <span className="font-medium">{r.product}</span> },
          { key: 'code', header: 'Código', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: 'isbn', header: 'ISBN', render: (r) => r.isbn || '—' },
          { key: 'qty', header: 'Cantidad' },
          { key: 'originBranch', header: 'Sucursal' },
          ...(!readOnly
            ? [
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (r: EventInventoryItem) => (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEdit(r)} className="p-1.5 rounded text-gray-400 hover:text-corporate hover:bg-corporate/5" aria-label="Editar">
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(items.filter((i) => i.id !== r.id))}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">No hay productos asignados al evento</p>
      )}
    </div>
  )
}
