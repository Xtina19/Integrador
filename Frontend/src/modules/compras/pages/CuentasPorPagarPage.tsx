import { useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { comprasApi, type CuentaPorPagarDto } from '@/services/api/comprasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { formatMoney } from '@/lib/money'

const estadoCxpMap: Record<string, { label: string; variant: 'warning' | 'info' | 'success' | 'danger' | 'neutral' }> = {
  Pendiente: { label: 'Pendiente', variant: 'warning' },
  'Pagado Parcial': { label: 'Parcial', variant: 'info' },
  Pagado: { label: 'Pagado', variant: 'success' },
  Vencido: { label: 'Vencido', variant: 'danger' },
}

export function CuentasPorPagarPage() {
  const { showError } = useToast()
  const [rows, setRows] = useState<CuentaPorPagarDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    if (!comprasApi.isEnabled()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const page = await comprasApi.listCuentasPorPagar(
        statusFilter === 'all' ? undefined : { estado: statusFilter },
      )
      setRows(page.data)
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga al cambiar filtro
  }, [statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.numeroFactura.toLowerCase().includes(q) ||
        r.proveedor.toLowerCase().includes(q) ||
        r.ordenCodigo.toLowerCase().includes(q),
    )
  }, [rows, search])

  const pendienteTotal = filtered
    .filter((r) => r.estado !== 'Pagado')
    .reduce((s, r) => s + Number(r.montoPendiente || 0), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por factura, proveedor u orden..."
            filters={
              <Select
                label="Estado CxP"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'Pendiente', label: 'Pendiente' },
                  { value: 'Pagado Parcial', label: 'Parcial' },
                  { value: 'Vencido', label: 'Vencido' },
                  { value: 'Pagado', label: 'Pagado' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Cuentas por pagar"
          subtitle={
            loading
              ? 'Cargando…'
              : `${filtered.length} cuenta${filtered.length === 1 ? '' : 's'} — pendiente ${formatMoney(pendienteTotal, 'DOP')}`
          }
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered as (CuentaPorPagarDto & Record<string, unknown>)[]}
            columns={[
              {
                key: 'numeroFactura',
                header: 'Factura',
                render: (r) => (
                  <span className="font-mono text-xs text-corporate flex items-center gap-1">
                    <Wallet size={14} /> {r.numeroFactura}
                  </span>
                ),
              },
              { key: 'proveedor', header: 'Proveedor', render: (r) => <span className="font-medium">{r.proveedor}</span> },
              { key: 'ordenCodigo', header: 'Orden', className: 'font-mono text-xs' },
              {
                key: 'tipoCompra',
                header: 'Tipo',
                render: (r) => (
                  <Badge variant={r.tipoCompra === 'internacional' ? 'info' : 'neutral'}>
                    {r.tipoCompra === 'internacional' ? 'Internacional' : 'Nacional'}
                  </Badge>
                ),
              },
              {
                key: 'fechaVencimiento',
                header: 'Vence',
                render: (r) => <span className="text-sm">{String(r.fechaVencimiento).slice(0, 10)}</span>,
              },
              {
                key: 'montoTotal',
                header: 'Total',
                className: 'text-right',
                render: (r) => (
                  <span className="tabular-nums">{r.montoTotal > 0 ? formatMoney(r.montoTotal, 'DOP') : '—'}</span>
                ),
              },
              {
                key: 'montoPendiente',
                header: 'Pendiente',
                className: 'text-right',
                render: (r) => (
                  <span className="font-semibold text-corporate tabular-nums">
                    {formatMoney(r.montoPendiente, 'DOP')}
                  </span>
                ),
              },
              {
                key: 'estado',
                header: 'Estado',
                render: (r) => {
                  const meta = estadoCxpMap[r.estado] ?? { label: r.estado, variant: 'neutral' as const }
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                },
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
