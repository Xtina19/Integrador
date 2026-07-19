import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { adminSuppliers } from '@/mocks/mockAdmin'
import { UTENSIL_OPTIONS, type EventUtensil } from '@/modules/eventos/types/eventExtended'
import { formatDop } from '@/lib/money'

interface EventUtensilsTabContentProps {
  items: EventUtensil[]
  onChange: (items: EventUtensil[]) => void
  readOnly?: boolean
}

const supplierNames = adminSuppliers.map((s) => s.name)

export function EventUtensilsTabContent({ items, onChange, readOnly = false }: EventUtensilsTabContentProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    supplier: string
    utensil: string
    qty: string
    unitCost: string
    notes: string
  }>({
    supplier: supplierNames[0] ?? '',
    utensil: UTENSIL_OPTIONS[0],
    qty: '1',
    unitCost: '',
    notes: '',
  })

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ supplier: supplierNames[0] ?? '', utensil: UTENSIL_OPTIONS[0], qty: '1', unitCost: '', notes: '' })
  }

  function handleSave() {
    const qty = Math.max(1, Number(form.qty) || 1)
    const unitCost = Math.max(0, Number(form.unitCost) || 0)
    const entry: EventUtensil = {
      id: editingId ?? `EU-${Date.now()}`,
      supplier: form.supplier,
      utensil: form.utensil,
      qty,
      unitCost,
      notes: form.notes,
    }
    if (editingId) {
      onChange(items.map((i) => (i.id === editingId ? entry : i)))
    } else {
      onChange([...items, entry])
    }
    resetForm()
  }

  function startEdit(item: EventUtensil) {
    setEditingId(item.id)
    setForm({
      supplier: item.supplier,
      utensil: item.utensil,
      qty: String(item.qty),
      unitCost: String(item.unitCost),
      notes: item.notes,
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Utensilios y materiales</h4>
          <p className="text-xs text-gray-500 mt-0.5">Materiales utilizados durante el evento (datos simulados)</p>
        </div>
        {!readOnly && (
          <Button size="sm" icon={Plus} onClick={() => { resetForm(); setShowForm(true) }}>
            Agregar utensilio
          </Button>
        )}
      </div>

      {showForm && !readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-surface border border-gray-100">
          <Select
            label="Proveedor"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            options={supplierNames.map((s) => ({ value: s, label: s }))}
          />
          <Select
            label="Utensilio"
            value={form.utensil}
            onChange={(e) => setForm({ ...form, utensil: e.target.value })}
            options={UTENSIL_OPTIONS.map((u) => ({ value: u, label: u }))}
          />
          <Input label="Cantidad" type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          <Input label="Costo unitario" type="number" min={0} step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
          <Input label="Observaciones" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>{editingId ? 'Actualizar' : 'Agregar'}</Button>
          </div>
        </div>
      )}

      <Table
        keyField="id"
        data={items as (EventUtensil & Record<string, unknown>)[]}
        columns={[
          { key: 'supplier', header: 'Proveedor' },
          { key: 'utensil', header: 'Utensilio', render: (r) => <span className="font-medium">{r.utensil}</span> },
          { key: 'qty', header: 'Cantidad' },
          { key: 'unitCost', header: 'Costo unitario', render: (r) => <span className="tabular-nums">{formatDop(r.unitCost)}</span> },
          {
            key: 'total',
            header: 'Costo total',
            render: (r) => <span className="font-semibold text-corporate tabular-nums">{formatDop(r.qty * r.unitCost)}</span>,
          },
          { key: 'notes', header: 'Observaciones', render: (r) => r.notes || '—' },
          ...(!readOnly
            ? [
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (r: EventUtensil) => (
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
        <p className="text-sm text-gray-400 text-center py-6">No hay utensilios registrados</p>
      )}
    </div>
  )
}
