import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { transferenciasApi, type TransferenciaDetalleDto } from '@/services/api/transferenciasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { newIdempotencyKey } from '@/utils/idempotency'
import { DetailPageShell } from '../components/DetailPageShell'

interface RecepcionForm {
  lineaId: string
  titulo: string
  pendiente: number
  cantidadRecibida: string
  cantidadFaltante: string
  cantidadDanada: string
}

export function RecepcionTransferenciaPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<TransferenciaDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<RecepcionForm[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await transferenciasApi.get(id)
      if (!res) {
        setError('Transferencia no encontrada.')
        return
      }
      if (res.estado !== 'en_transito' && res.estado !== 'recibida_parcial') {
        setError(`No se puede registrar recepción en estado "${res.estado}".`)
      }
      setData(res)
      setForm(
        res.lineas.map((l) => ({
          lineaId: l.id,
          titulo: l.titulo ?? l.productoId,
          pendiente: l.cantidadDespachada - l.cantidadRecibida - l.cantidadFaltante - l.cantidadDanada,
          cantidadRecibida: '0',
          cantidadFaltante: '0',
          cantidadDanada: '0',
        })),
      )
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const validationErrors = useMemo(() => {
    const errs: string[] = []
    let total = 0
    for (const f of form) {
      const rec = Number(f.cantidadRecibida) || 0
      const falt = Number(f.cantidadFaltante) || 0
      const dan = Number(f.cantidadDanada) || 0
      if (rec < 0 || falt < 0 || dan < 0) errs.push(`Cantidades negativas en ${f.titulo}.`)
      if (rec + falt + dan > f.pendiente) errs.push(`La recepción de ${f.titulo} supera lo pendiente (${f.pendiente}).`)
      total += rec + falt + dan
    }
    if (total === 0) errs.push('Debe registrar al menos una cantidad recibida, faltante o dañada.')
    return errs
  }, [form])

  function updateLinea(lineaId: string, field: keyof RecepcionForm, value: string) {
    setForm((prev) => prev.map((f) => (f.lineaId === lineaId ? { ...f, [field]: value } : f)))
  }

  async function handleSave() {
    if (!data) return
    if (validationErrors.length) {
      showError(validationErrors[0])
      return
    }
    setSaving(true)
    try {
      const recepciones = form
        .map((f) => ({
          lineaId: f.lineaId,
          cantidadRecibida: Number(f.cantidadRecibida) || 0,
          cantidadFaltante: Number(f.cantidadFaltante) || 0,
          cantidadDanada: Number(f.cantidadDanada) || 0,
        }))
        .filter((r) => r.cantidadRecibida + r.cantidadFaltante + r.cantidadDanada > 0)

      const res = await transferenciasApi.recibir(data.id, data.version, newIdempotencyKey(), recepciones)
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo registrar la recepción.')
        return
      }
      showSuccess('Recepción registrada correctamente')
      navigate(`/inventario/transferencias/${data.id}`)
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Transferencias', to: '/inventario?tab=transferencias' },
        { label: data?.codigo ?? id, to: data ? `/inventario/transferencias/${data.id}` : undefined },
        { label: 'Recepción' },
      ]}
      backPath={data ? `/inventario/transferencias/${data.id}` : '/inventario?tab=transferencias'}
      title="Registrar recepción"
      loading={loading}
      error={error || validationErrors[0] || null}
    >
      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Líneas pendientes de recepción" />
            <CardBody className="!p-0">
              <Table
                keyField="lineaId"
                data={form}
                columns={[
                  {
                    key: 'titulo',
                    header: 'Producto',
                    render: (f) => <span className="font-medium">{f.titulo}</span>,
                  },
                  {
                    key: 'pendiente',
                    header: 'Pendiente',
                    render: (f) => <span className="tabular-nums font-semibold">{f.pendiente}</span>,
                  },
                  {
                    key: 'cantidadRecibida',
                    header: 'Recibida',
                    render: (f) => (
                      <input
                        type="number"
                        min={0}
                        max={f.pendiente}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        value={f.cantidadRecibida}
                        onChange={(e) => updateLinea(f.lineaId, 'cantidadRecibida', e.target.value)}
                      />
                    ),
                  },
                  {
                    key: 'cantidadFaltante',
                    header: 'Faltante',
                    render: (f) => (
                      <input
                        type="number"
                        min={0}
                        max={f.pendiente}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        value={f.cantidadFaltante}
                        onChange={(e) => updateLinea(f.lineaId, 'cantidadFaltante', e.target.value)}
                      />
                    ),
                  },
                  {
                    key: 'cantidadDanada',
                    header: 'Dañada',
                    render: (f) => (
                      <input
                        type="number"
                        min={0}
                        max={f.pendiente}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        value={f.cantidadDanada}
                        onChange={(e) => updateLinea(f.lineaId, 'cantidadDanada', e.target.value)}
                      />
                    ),
                  },
                ]}
              />
            </CardBody>
          </Card>

          <div className="flex flex-col items-stretch justify-end gap-3 border-t border-gray-200 pt-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => navigate(`/inventario/transferencias/${data.id}`)}>
              Cancelar
            </Button>
            <Button icon={Save} onClick={() => void handleSave()} disabled={saving || validationErrors.length > 0}>
              {saving ? 'Guardando…' : 'Confirmar recepción'}
            </Button>
          </div>
        </div>
      )}
    </DetailPageShell>
  )
}
