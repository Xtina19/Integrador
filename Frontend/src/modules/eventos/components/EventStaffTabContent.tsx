import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { fetchArray } from '../utils/apiLists'
import { apiConfig } from '@/config/api'
import type { EventStaffMember } from '@/modules/eventos/types/eventExtended'

const API_BASE = `${apiConfig.baseUrl}/api`

const ROLES = ['Coordinador', 'Seguridad', 'Logística', 'Recepción']

interface PersonaOption {
  id_persona: number
  tipo_persona: string
  nombre: string
}

interface EventStaffTabContentProps {
  items: EventStaffMember[]
  onChange: (items: EventStaffMember[]) => void
  readOnly?: boolean
}

export function EventStaffTabContent({ items, onChange, readOnly = false }: EventStaffTabContentProps) {
  const [personas, setPersonas] = useState<PersonaOption[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    id_persona: '',
    rol: ROLES[0],
    horaEntrada: '',
    horaSalida: '',
    costo: '',
    observacion: '',
  })

  useEffect(() => {
  async function load() {
    try {
      const data = await fetchArray<PersonaOption>(`${API_BASE}/eventos/personas`)
      setPersonas(data)
    } catch (err) {
      console.error('Error cargando personas:', err)
      setPersonas([])
    } finally {
      setLoadingPersonas(false)
    }
  }

  load()
}, [])

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ id_persona: '', rol: ROLES[0], horaEntrada: '', horaSalida: '', costo: '', observacion: '' })
  }

  function handleSave() {
    if (!form.id_persona) return
    const persona = personas.find((p) => String(p.id_persona) === form.id_persona)
    if (!persona) return

    const entry: EventStaffMember = {
      id: editingId ?? `PE-${Date.now()}`,
      id_persona: persona.id_persona,
      personaNombre: persona.nombre,
      rol: form.rol,
      horaEntrada: form.horaEntrada,
      horaSalida: form.horaSalida,
      costo: form.costo,
      observacion: form.observacion,
    }

    if (editingId) {
      onChange(items.map((i) => (i.id === editingId ? entry : i)))
    } else {
      onChange([...items, entry])
    }
    resetForm()
  }

  function startEdit(item: EventStaffMember) {
    setEditingId(item.id)
    setForm({
      id_persona: String(item.id_persona),
      rol: item.rol,
      horaEntrada: item.horaEntrada,
      horaSalida: item.horaSalida,
      costo: item.costo,
      observacion: item.observacion,
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Personal asignado al evento</h4>
          <p className="text-xs text-gray-500 mt-0.5">Seleccione personas registradas y su rol en el evento</p>
        </div>
        {!readOnly && (
          <Button size="sm" icon={Plus} onClick={() => { resetForm(); setShowForm(true) }}>
            Agregar personal
          </Button>
        )}
      </div>

      {showForm && !readOnly && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-surface border border-gray-100">
          <Select
            label="Persona"
            value={form.id_persona}
            onChange={(e) => setForm({ ...form, id_persona: e.target.value })}
            disabled={loadingPersonas}
            options={[
              { value: '', label: loadingPersonas ? 'Cargando...' : 'Seleccione persona...' },
              ...personas.map((p) => ({ value: String(p.id_persona), label: p.nombre })),
            ]}
          />
          <Select
            label="Rol"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />
          <Input label="Costo" type="number" min={0} value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} />
          <Input label="Hora de entrada" type="datetime-local" value={form.horaEntrada} onChange={(e) => setForm({ ...form, horaEntrada: e.target.value })} />
          <Input label="Hora de salida" type="datetime-local" value={form.horaSalida} onChange={(e) => setForm({ ...form, horaSalida: e.target.value })} />
          <Input label="Observaciones" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} className="md:col-span-3" />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.id_persona}>
              {editingId ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      <Table
        keyField="id"
        data={items as (EventStaffMember & Record<string, unknown>)[]}
        columns={[
          { key: 'personaNombre', header: 'Persona', render: (r) => <span className="font-medium">{r.personaNombre}</span> },
          { key: 'rol', header: 'Rol' },
          { key: 'costo', header: 'Costo', render: (r) => (r.costo ? `RD$${Number(r.costo).toLocaleString()}` : '—') },
          { key: 'observacion', header: 'Observaciones', render: (r) => r.observacion || '—' },
          ...(!readOnly
            ? [
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (r: EventStaffMember) => (
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
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-6 py-10 text-center">
          <Users size={28} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No hay personal asignado a este evento todavía.</p>
        </div>
      )}
    </div>
  )
}