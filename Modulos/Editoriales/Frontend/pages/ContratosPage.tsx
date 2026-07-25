import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { adminPath } from '@/lib/adminConfig'
import { formatEditorialDate } from '@/lib/editorialesDisplay'
import {
  contractStatusConfig,
  daysUntilExpiry,
  getContractVisualStatus,
} from '@/lib/publisherContractStatus'
import { editorialesApi, type EditorialRecord } from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

export function ContratosPage() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const [publishers, setPublishers] = useState<EditorialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPublishers(await editorialesApi.list({ q: search || undefined }))
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, showError])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => {
    return publishers
      .map((p) => {
        const visual = getContractVisualStatus(p.contractExpiry)
        const days = daysUntilExpiry(p.contractExpiry)
        return { ...p, visual, days }
      })
      .filter((p) => statusFilter === 'all' || p.visual === statusFilter)
  }, [publishers, statusFilter])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar editorial o tipo de contrato..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Vigente' },
                  { value: 'expiring', label: 'Por vencer' },
                  { value: 'expired', label: 'Vencido' },
                  { value: 'none', label: 'Sin fecha' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [contractStatusConfig[statusFilter as keyof typeof contractStatusConfig]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Contratos de editoriales"
          subtitle={loading ? 'Cargando…' : `${rows.length} registros`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={rows}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span>,
              },
              { key: 'name', header: 'Editorial', render: (p) => <span className="font-medium">{p.name}</span> },
              { key: 'contractType', header: 'Tipo de contrato', render: (p) => p.contractType || '—' },
              {
                key: 'contractExpiry',
                header: 'Vencimiento',
                render: (p) => (
                  <span className="text-sm tabular-nums text-gray-700">{formatEditorialDate(p.contractExpiry)}</span>
                ),
              },
              {
                key: 'days',
                header: 'Días restantes',
                render: (p) =>
                  p.days === null ? (
                    '—'
                  ) : (
                    <span
                      className={
                        p.days < 0
                          ? 'text-red-600 font-semibold tabular-nums'
                          : p.days <= 30
                            ? 'text-amber-700 font-semibold tabular-nums'
                            : 'text-gray-700 tabular-nums'
                      }
                    >
                      {p.days}
                    </span>
                  ),
              },
              {
                key: 'visual',
                header: 'Estado',
                render: (p) => {
                  const cfg = contractStatusConfig[p.visual]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (p) => (
                  <TableActions
                    onView={() => navigate(adminPath('editoriales', 'ver', p.id))}
                    onEdit={() => navigate(adminPath('editoriales', 'editar', p.id))}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
