import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { fetchArray } from '../utils/apiLists'
import { apiConfig } from '@/config/api'
import type { EventUtensil } from '@/modules/eventos/types/eventExtended'

const API_BASE = `${apiConfig.baseUrl}/api`

interface MaterialOption {
  id_material: number
  nombre: string
  descripcion: string | null
  categoria: string | null
  unidad_medida: string | null
  costo_estimado: number | null
  es_consumible: boolean
}

interface ProveedorOption {
  id_proveedor: number
  codigo_proveedor: string
  nombre_comercial: string
  contacto_nombre: string
}

interface EventUtensilsTabContentProps {
  items: EventUtensil[]
  onChange: (items: EventUtensil[]) => void
  readOnly?: boolean
}

export function EventUtensilsTabContent({ items, onChange, readOnly = false }: EventUtensilsTabContentProps) {
  const [materiales, setMateriales] = useState<MaterialOption[]>([])
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    id_material: '',
    id_proveedor: '',
    qty: '1',
    unitCost: '',
    notes: '',
  })

  useEffect(() => {
  async function load() {
    try {
      const [mat, prov] = await Promise.all([
        fetchArray<MaterialOption>(`${API_BASE}/eventos/materiales`),
        fetchArray<ProveedorOption>(`${API_BASE}/eventos/proveedores`),
      ])

      setMateriales(mat)
      setProveedores(prov)
    } catch (err) {
      console.error('Error cargando materiales/proveedores:', err)
      setMateriales([])
      setProveedores([])
    } finally {
      setLoading(false)
    }
  }

  load()
}, [])

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ id_material: '', id_proveedor: '', qty: '1', unitCost: '', notes: '' })
  }

  function handleSave() {
    if (!form.id_material || !form.id_proveedor) return
    const material = materiales.find((m) => String(m.id_material) === form.id_material)
    const proveedor = proveedores.find((p) => String(p.id_proveedor) === form.id_proveedor)
    if (!material || !proveedor) return

    const qty = Math.max(1, Number(form.qty) || 1)
    const unitCost = Math.max(0, Number(form.unitCost) || 0)

    const entry: EventUtensil = {
      id: editingId ?? `EU-${Date.now()}`,
      supplier: proveedor.nombre_comercial,
      utensil: material.nombre,
      qty,
      unitCost,
      notes: form.notes,
      id_material: material.id_material,
      id_proveedor: proveedor.id_proveedor,
    }

    if (editingId) {
      onChange(items.map((i) => (i.id === editingId ? entry : i)))
    } else {
      onChange([...items, entry])
    }
    resetForm()
  }

  function startEdit(item: EventUtensil) {
    const anyItem = item as EventUtensil & { id_material?: number; id_proveedor?: number }
    setEditingId(item.id)
    setForm({
      id_material: anyItem.id_material ? String(anyItem.id_material) : '',
      id_proveedor: anyItem.id_proveedor ? String(anyItem.id_proveedor) : '',
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
          <p className="text-xs text-gray-500 mt-0.5">Materiales y su proveedor asignado para este evento</p>
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
            label="Material"
            value={form.id_material}
            onChange={(e) => setForm({ ...form, id_material: e.target.value })}
            disabled={loading}
            options={[
              { value: '', label: loading ? 'Cargando...' : 'Seleccione material...' },
              ...materiales.map((m) => ({ value: String(m.id_material), label: m.nombre })),
            ]}
          />
          <Select
            label="Proveedor"
            value={form.id_proveedor}
            onChange={(e) => setForm({ ...form, id_proveedor: e.target.value })}
            disabled={loading}
            options={[
              { value: '', label: loading ? 'Cargando...' : 'Seleccione proveedor...' },
              ...proveedores.map((p) => ({ value: String(p.id_proveedor), label: p.nombre_comercial })),
            ]}
          />
          <Input label="Cantidad" type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          <Input label="Costo unitario" type="number" min={0} step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
          <Input label="Observaciones" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.id_material || !form.id_proveedor}>
              {editingId ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      <Table
        keyField="id"
        data={items as (EventUtensil & Record<string, unknown>)[]}
        columns={[
          { key: 'supplier', header: 'Proveedor' },
          { key: 'utensil', header: 'Material', render: (r) => <span className="font-medium">{r.utensil}</span> },
          { key: 'qty', header: 'Cantidad' },
          { key: 'unitCost', header: 'Costo unitario', render: (r) => `RD$${r.unitCost.toLocaleString()}` },
          {
            key: 'total',
            header: 'Costo total',
            render: (r) => <span className="font-semibold text-corporate">RD${(r.qty * r.unitCost).toLocaleString()}</span>,
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