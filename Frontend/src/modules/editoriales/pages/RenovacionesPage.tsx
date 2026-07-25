import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { formatEditorialDate } from '@/lib/editorialesDisplay'
import {
  contractStatusConfig,
  daysUntilExpiry,
  getContractVisualStatus,
} from '@/lib/publisherContractStatus'
import { editorialesApi, type EditorialRecord } from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export function RenovacionesPage() {
  const { showError } = useToast()
  const [publishers, setPublishers] = useState<EditorialRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await editorialesApi.list()
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
  }, [showError])

  const { expired, expiring, active, rows } = useMemo(() => {
    const enriched = publishers.map((p) => ({
      ...p,
      visual: getContractVisualStatus(p.contractExpiry),
      days: daysUntilExpiry(p.contractExpiry),
    }))
    return {
      expired: enriched.filter((p) => p.visual === 'expired'),
      expiring: enriched.filter((p) => p.visual === 'expiring'),
      active: enriched.filter((p) => p.visual === 'active'),
      rows: enriched.filter((p) => p.visual === 'expired' || p.visual === 'expiring'),
    }
  }, [publishers])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Vencidos"
          value={expired.length}
          detail="Requieren renovación"
          icon={<XCircle size={22} />}
        />
        <StatCard
          title="Por vencer"
          value={expiring.length}
          detail="Próximos 30 días"
          icon={<AlertTriangle size={22} />}
        />
        <StatCard
          title="Vigentes"
          value={active.length}
          detail="Más de 30 días"
          icon={<CheckCircle2 size={22} />}
        />
      </div>

      <Card>
        <CardHeader
          title="Prioridad de renovación"
          subtitle={loading ? 'Cargando…' : `${rows.length} contratos vencidos o por vencer`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={rows}
            columns={[
              { key: 'code', header: 'Código', render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span> },
              { key: 'name', header: 'Editorial', render: (p) => <span className="font-medium">{p.name}</span> },
              { key: 'contractType', header: 'Tipo', render: (p) => p.contractType || '—' },
              {
                key: 'contractExpiry',
                header: 'Vencimiento',
                render: (p) => (
                  <span className="text-sm tabular-nums text-gray-700">{formatEditorialDate(p.contractExpiry)}</span>
                ),
              },
              {
                key: 'days',
                header: 'Días',
                render: (p) => (
                  <span
                    className={
                      p.days !== null && p.days < 0
                        ? 'text-red-600 font-semibold tabular-nums'
                        : 'font-semibold tabular-nums'
                    }
                  >
                    {p.days ?? '—'}
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
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
