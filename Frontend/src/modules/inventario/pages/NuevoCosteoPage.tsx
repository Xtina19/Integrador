import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { useProductosMaestro } from '@/hooks/useProductosMaestro'
import { validateCosting } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useToast } from '@/context/ToastContext'
import { costeoInventarioApi, type CosteoInventarioDto } from '@/services/api/costeoInventarioApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export function NuevoCosteoPage() {
  const { showSuccess, showError } = useToast()
  const { productos } = useProductosMaestro()
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState<CosteoInventarioDto[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(true)
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingHistorial(true)
      try {
        const list = await costeoInventarioApi.list({ limit: 20 })
        if (!cancelled) setHistorial(list)
      } catch {
        if (!cancelled) setHistorial([])
      } finally {
        if (!cancelled) setLoadingHistorial(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
      onSave={async () => {
        if (!validation.valid || !selected) {
          setError(validation.errors.join(' ') || 'Seleccione un producto del catálogo.')
          return false
        }
        try {
          const registro = await costeoInventarioApi.registrar({
            productoId: selected.id,
            newCost: Number(form.newCost) || 0,
            costType: form.costType,
            notes: trim(form.notes),
            origen: form.costType === 'Importación' ? 'importacion' : 'manual',
          })
          setHistorial((prev) => [registro, ...prev])
          showSuccess(`Costeo registrado para ${selected.title}`)
          return true
        } catch (e) {
          showError(getFriendlyErrorMessage(e))
          return false
        }
      }}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}
      {!validation.valid && !error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}

      <div className="text-sm text-gray-600 bg-surface border border-gray-100 rounded-lg px-4 py-3 mb-6">
        Actualiza <strong>Producto.costo_referencia</strong> en inventario. Los costeos desde{' '}
        <Link to="/importaciones/costeo" className="text-corporate hover:underline">
          Importaciones → Costeo por Libro
        </Link>{' '}
        también se registran aquí al aplicarlos.
      </div>

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
        <Input
          label="Nuevo costo *"
          type="number"
          min={0}
          step="0.01"
          value={form.newCost}
          onChange={(e) => setForm({ ...form, newCost: e.target.value })}
        />
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

      <Card className="mt-8">
        <CardHeader
          title="Historial de costeos"
          subtitle={loadingHistorial ? 'Cargando…' : `${historial.length} registros recientes`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={historial}
            columns={[
              {
                key: 'fecha',
                header: 'Fecha',
                render: (r) => (
                  <span className="text-xs text-gray-600">
                    {r.fecha ? new Date(r.fecha).toLocaleString() : '—'}
                  </span>
                ),
              },
              { key: 'producto', header: 'Producto', render: (r) => <span className="font-medium">{r.producto}</span> },
              {
                key: 'previousCost',
                header: 'Anterior',
                render: (r) => <span className="tabular-nums">${r.previousCost.toFixed(2)}</span>,
              },
              {
                key: 'newCost',
                header: 'Nuevo',
                render: (r) => <span className="font-semibold text-corporate tabular-nums">${r.newCost.toFixed(2)}</span>,
              },
              { key: 'costType', header: 'Tipo', render: (r) => r.costType },
              {
                key: 'origen',
                header: 'Origen',
                render: (r) =>
                  r.origen === 'importacion' ? (
                    <Badge variant="info">Importación{r.documentoRef ? ` · ${r.documentoRef}` : ''}</Badge>
                  ) : (
                    <Badge variant="default">Manual</Badge>
                  ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </FormPageLayout>
  )
}
