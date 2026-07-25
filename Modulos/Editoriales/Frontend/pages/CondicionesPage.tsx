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

export function CondicionesPage() {
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

  const rows = useMemo(() => publishers, [publishers])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar editorial o contacto..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Condiciones comerciales"
          subtitle={loading ? 'Cargando…' : `${rows.length} registros`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={rows}
            columns={[
              { key: 'name', header: 'Editorial', render: (p) => <span className="font-medium">{p.name}</span> },
              {
                key: 'contractType',
                header: 'Condición / tipo',
                render: (p) => <Badge variant="gold">{p.contractType || 'Sin definir'}</Badge>,
              },
              {
                key: 'contractExpiry',
                header: 'Vigencia hasta',
                render: (p) => (
                  <span className="text-sm tabular-nums text-gray-700">{formatEditorialDate(p.contractExpiry)}</span>
                ),
              },
              {
                key: 'visual',
                header: 'Estado',
                render: (p) => {
                  const cfg = contractStatusConfig[getContractVisualStatus(p.contractExpiry)]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              { key: 'contact', header: 'Contacto', render: (p) => <span className="text-sm text-gray-700">{p.contact || '—'}</span> },
              { key: 'email', header: 'Email', render: (p) => <span className="text-sm text-gray-600">{p.email || '—'}</span> },
              { key: 'phone', header: 'Teléfono', render: (p) => <span className="text-sm tabular-nums text-gray-700">{p.phone || '—'}</span> },
              { key: 'country', header: 'País', render: (p) => <span className="text-sm text-gray-700">{p.country || '—'}</span> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
