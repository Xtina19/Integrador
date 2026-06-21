import { useState } from 'react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'
import { adminSuppliers } from '../../data/adminMockData'
import { shipmentStatusMap } from '../../data/importsMockData'

export function RegistrarEmbarquePage() {
  const [form, setForm] = useState({
    code: '',
    type: 'Marítimo',
    origin: '',
    destination: 'Santo Domingo, RD',
    departure: '',
    arrival: '',
    boxes: '',
    supplier: adminSuppliers[0]?.name ?? '',
    status: 'in_transit',
  })

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Importaciones', to: '/importaciones' },
        { label: 'Embarques', to: '/importaciones/embarques' },
        { label: 'Registrar Embarque' },
      ]}
      title="Registrar Embarque"
      subtitle="Nuevo embarque internacional"
      listPath="/importaciones/embarques"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Código embarque *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <Select
          label="Tipo *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={[
            { value: 'Marítimo', label: 'Marítimo' },
            { value: 'Aéreo', label: 'Aéreo' },
            { value: 'Courier', label: 'Courier' },
          ]}
        />
        <Input label="Origen *" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
        <Input label="Destino *" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
        <Input label="Fecha salida *" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} />
        <Input label="Fecha estimada llegada *" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} />
        <Input label="Cantidad de cajas *" type="number" min={1} value={form.boxes} onChange={(e) => setForm({ ...form, boxes: e.target.value })} />
        <Select
          label="Proveedor *"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          options={adminSuppliers.map((s) => ({ value: s.name, label: s.name }))}
        />
        <Select
          label="Estado *"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={Object.entries(shipmentStatusMap).map(([value, cfg]) => ({ value, label: cfg.label }))}
          className="md:col-span-2"
        />
      </div>
    </FormPageLayout>
  )
}
