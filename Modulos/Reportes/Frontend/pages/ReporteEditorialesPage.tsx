import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { formatEditorialDate } from '@/lib/editorialesDisplay'
import { contractStatusConfig, getContractVisualStatus } from '@/lib/publisherContractStatus'
import { editorialesApi, type EditorialRecord } from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { useTableExport } from '@/hooks/useTableExport'

export function ReporteEditorialesPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Reporte Editoriales')
  const { showError } = useToast()
  const [publishers, setPublishers] = useState<EditorialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const list = await editorialesApi.list({ q: search || undefined })
        if (!cancelled) setPublishers(list)
      } catch (err) {
        if (!cancelled) showError(getFriendlyErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [search, showError])

  const filtered = useMemo(() => publishers, [publishers])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por editorial o código..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Código', 'Editorial', 'Tipo', 'Vencimiento', 'Estado contrato', 'Estado', 'Productos'],
                filtered.map((c) => {
                  const visual = getContractVisualStatus(c.contractExpiry)
                  return [
                    c.code,
                    c.name,
                    c.contractType || '',
                    formatEditorialDate(c.contractExpiry),
                    contractStatusConfig[visual].label,
                    c.status === 'active' ? 'Activo' : 'Inactivo',
                    String(c.productCount),
                  ]
                })
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Reporte de editoriales"
          subtitle={loading ? 'Cargando…' : `${filtered.length} registros`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código', render: (c) => <span className="font-mono text-xs text-corporate">{c.code}</span> },
              { key: 'name', header: 'Editorial', render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'contractType', header: 'Tipo', render: (c) => c.contractType || '—' },
              {
                key: 'contractExpiry',
                header: 'Vencimiento',
                render: (c) => (
                  <span className="text-sm tabular-nums text-gray-700">{formatEditorialDate(c.contractExpiry)}</span>
                ),
              },
              {
                key: 'visual',
                header: 'Estado contrato',
                render: (c) => {
                  const cfg = contractStatusConfig[getContractVisualStatus(c.contractExpiry)]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => (
                  <Badge variant={c.status === 'active' ? 'success' : 'neutral'}>
                    {c.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'productCount',
                header: 'Productos',
                render: (c) => <span className="font-semibold text-corporate tabular-nums">{c.productCount}</span>,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
