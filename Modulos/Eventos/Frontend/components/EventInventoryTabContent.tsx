import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { useProductosMaestro } from '@/hooks/useProductosMaestro'
import { almacenesApi } from '@/services/api/almacenesApi'
import type { EventInventoryItem } from '@/modules/eventos/types/eventExtended'

interface EventInventoryTabContentProps {
  items: EventInventoryItem[]
  onChange: (items: EventInventoryItem[]) => void
  readOnly?: boolean
}

export function EventInventoryTabContent({ items, onChange, readOnly = false }: EventInventoryTabContentProps) {
  const { productos } = useProductosMaestro()
  const [sucursales, setSucursales] = useState<Array<{ id: string; name: string }>>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('1')
  const [originBranch, setOriginBranch] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await almacenesApi.list()
        if (cancelled) return
        const list = (rows as Record<string, unknown>[])
          .map((r) => ({
            id: String(r.id ?? ''),
            name: String(r.nombre ?? r.name ?? r.id ?? ''),
          }))
          .filter((a) => a.id)
        setSucursales(list)
        if (list[0] && !originBranch) setOriginBranch(list[0].name)
      } catch {
        /* catálogo opcional en eventos prototype */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [originBranch])

  useEffect(() => {
    if (!productId && productos[0]) setProductId(productos[0].id)
  }, [productos, productId])

  const selectedProduct = productos.find((p) => p.id === productId)

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setProductId(productos[0]?.id ?? '')
    setQty('1')
    setOriginBranch(sucursales[0]?.name ?? '')
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
          <p className="text-xs text-gray-500 mt-0.5">
            Productos del catálogo maestro que serán enviados a la feria
          </p>
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
            options={productos.map((p) => ({ value: p.id, label: p.title }))}
            className="md:col-span-2"
          />
          <Input label="Cantidad" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          <Select
            label="Sucursal origen"
            value={originBranch}
            onChange={(e) => setOriginBranch(e.target.value)}
            options={sucursales.map((b) => ({ value: b.name, label: b.name }))}
          />
          <div className="md:col-span-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!selectedProduct}>
              {editingId ? 'Actualizar' : 'Agregar'}
            </Button>
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
          ...(readOnly
            ? []
            : [
                {
                  key: 'actions',
                  header: '',
                  render: (r: EventInventoryItem & Record<string, unknown>) => (
                    <div className="flex gap-1 justify-end">
                      <button type="button" className="p-1.5 rounded hover:bg-gray-100" onClick={() => startEdit(r as EventInventoryItem)}>
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-red-50"
                        onClick={() => onChange(items.filter((i) => i.id !== r.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ),
                },
              ]),
        ]}
      />
    </div>
  )
}
