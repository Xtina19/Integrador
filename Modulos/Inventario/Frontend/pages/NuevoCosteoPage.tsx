import { useEffect, useMemo, useState } from 'react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { useProductosMaestro } from '@/hooks/useProductosMaestro'
import { validateCosting } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useToast } from '@/context/ToastContext'

const STORAGE_KEY = 'inventario_costeos'

interface CosteoRegistro {
  id: string
  fecha: string
  producto: string
  productoId: string
  previousCost: number
  newCost: number
  costType: string
  notes: string
}

/**
 * Provisional: no existe endpoint backend para costeo aún.
 * Se persiste localmente en localStorage (clave `inventario_costeos`) hasta que
 * el backend expone POST /api/inventario/costeos.
 */
function saveCosteoLocal(registro: CosteoRegistro) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const list: CosteoRegistro[] = raw ? JSON.parse(raw) : []
    list.unshift(registro)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* localStorage no disponible */
  }
}

export function NuevoCosteoPage() {
  const { showSuccess } = useToast()
  const { productos } = useProductosMaestro()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    productId: '',
    previousCost: '0',
    newCost: '',
    costType: 'Actualización de costo',
    notes: '',
  })

  useEffect(() => {
    if (!form.productId && productos[0]) {
      setForm((f) => ({
        ...f,
        productId: productos[0].id,
        previousCost: String(productos[0].cost || productos[0].price || 0),
      }))
    }
  }, [productos, form.productId])

  const selected = productos.find((p) => p.id === form.productId)

  const validation = useMemo(
    () =>
      validateCosting({
        product: selected?.title ?? '',
        newCost: form.newCost,
        costType: form.costType,
        notes: form.notes,
      }),
    [form, selected],
  )

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Nuevo Costeo' },
      ]}
      title="Nuevo Costeo"
      listPath="/inventario"
      saveDisabled={!validation.valid || !selected}
      onSave={() => {
        if (!validation.valid || !selected) {
          setError(validation.errors.join(' ') || 'Seleccione un producto del catálogo.')
          return false
        }
        saveCosteoLocal({
          id: `CST-${Date.now()}`,
          fecha: new Date().toISOString(),
          producto: selected.title,
          productoId: selected.id,
          previousCost: Number(form.previousCost) || 0,
          newCost: Number(form.newCost) || 0,
          costType: form.costType,
          notes: trim(form.notes),
        })
        showSuccess(`Costeo registrado para ${selected.title} (provisional, guardado localmente)`)
        return true
      }}
    >
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>}
      {!validation.valid && !error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Producto *"
          value={form.productId}
          onChange={(e) => {
            const p = productos.find((x) => x.id === e.target.value)
            setForm({
              ...form,
              productId: e.target.value,
              previousCost: String(p?.cost || p?.price || 0),
            })
          }}
          options={productos.map((p) => ({ value: p.id, label: p.title }))}
          className="md:col-span-2"
        />
        <Input label="Costo anterior" type="number" value={form.previousCost} readOnly className="bg-gray-50" />
        <Input label="Nuevo costo *" type="number" min={0} step="0.01" value={form.newCost} onChange={(e) => setForm({ ...form, newCost: e.target.value })} />
        <Select
          label="Tipo de costeo *"
          value={form.costType}
          onChange={(e) => setForm({ ...form, costType: e.target.value })}
          options={[
            { value: 'Actualización de costo', label: 'Actualización de costo' },
            { value: 'Importación', label: 'Importación' },
            { value: 'Ajuste por flete', label: 'Ajuste por flete' },
            { value: 'Promoción / liquidación', label: 'Promoción / liquidación' },
          ]}
        />
        <Input
          label="Observaciones"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="md:col-span-2"
        />
      </div>
    </FormPageLayout>
  )
}
