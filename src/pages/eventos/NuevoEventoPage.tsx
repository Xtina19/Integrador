import { useState } from 'react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'

const eventTypes = [
  { value: 'feria', label: 'Feria' },
  { value: 'evento', label: 'Evento' },
  { value: 'presentacion', label: 'Presentación' },
  { value: 'taller', label: 'Taller' },
]

const responsables = [
  'Laura Méndez',
  'Carlos Ruiz',
  'Ana Martínez',
  'Luis Hernández',
  'Roberto Sánchez',
]

export function NuevoEventoPage() {
  const [form, setForm] = useState({
    name: '',
    type: 'feria',
    startDate: '',
    endDate: '',
    location: '',
    budget: '',
    responsible: responsables[0],
    description: '',
  })

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Eventos y Ferias', to: '/eventos' },
        { label: 'Nuevo Evento' },
      ]}
      title="Nuevo Evento"
      subtitle="Registro de feria o evento comercial"
      listPath="/eventos"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Nombre evento *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Select
          label="Tipo evento *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={eventTypes}
        />
        <Input label="Lugar *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Input label="Fecha inicio *" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <Input label="Fecha fin *" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <Input label="Presupuesto *" type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        <Select
          label="Responsable *"
          value={form.responsible}
          onChange={(e) => setForm({ ...form, responsible: e.target.value })}
          options={responsables.map((r) => ({ value: r, label: r }))}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>
    </FormPageLayout>
  )
}
