import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, FileText, BookMarked, AlertTriangle, Ban } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { adminPath } from '@/lib/adminConfig'
import { formatEditorialDate } from '@/lib/editorialesDisplay'
import { editorialesApi, type EditorialDashboard } from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

export function EditorialesDashboard() {
  const navigate = useNavigate()
  const { showError } = useToast()
  const [stats, setStats] = useState<EditorialDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await editorialesApi.dashboard()
        if (!cancelled) setStats(data)
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

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando dashboard de editoriales…</p>
  }

  if (!stats) {
    return <p className="text-sm text-gray-500">No fue posible cargar las estadísticas.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total editoriales"
          value={stats.total}
          detail={`${stats.active} activas · ${stats.inactive} inactivas`}
          icon={<BookMarked size={22} />}
        />
        <StatCard
          title="Editoriales activas"
          value={stats.active}
          detail="Estado activo en catálogo"
          icon={<Globe size={22} />}
        />
        <StatCard
          title="Sin productos"
          value={stats.withoutProducts}
          detail="Editoriales sin catálogo asociado"
          icon={<Ban size={22} />}
        />
        <StatCard
          title="Contratos por vencer"
          value={stats.contractsExpiring}
          detail={`${stats.contractsExpired} vencidos · ${stats.contractsActive} vigentes`}
          icon={<AlertTriangle size={22} />}
        />
      </div>

      {stats.topByProducts && (
        <Card>
          <CardHeader
            title="Editorial con más productos"
            subtitle={`${stats.topByProducts.name} · ${stats.topByProducts.productCount} productos`}
          />
          <CardBody>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(adminPath('editoriales', 'ver', stats.topByProducts!.id))}
            >
              Ver detalle
            </Button>
          </CardBody>
        </Card>
      )}

      {stats.expiringSoon.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader title="Contratos próximos a vencer" subtitle="Próximos 30 días" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={stats.expiringSoon}
              columns={[
                { key: 'name', header: 'Editorial', render: (p) => <span className="font-medium">{p.name}</span> },
                { key: 'contractType', header: 'Tipo' },
                {
                  key: 'contractExpiry',
                  header: 'Vencimiento',
                  render: (p) => (
                    <Badge variant="warning">
                      <span className="tabular-nums">{formatEditorialDate(p.contractExpiry)}</span>
                    </Badge>
                  ),
                },
                {
                  key: 'daysRemaining',
                  header: 'Días restantes',
                  render: (p) => (
                    <span className="font-semibold text-amber-700 tabular-nums">{p.daysRemaining}</span>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  render: (p) => (
                    <Button size="sm" variant="outline" onClick={() => navigate(adminPath('editoriales', 'editar', p.id))}>
                      Renovar
                    </Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Productos por editorial"
          subtitle={`${stats.productsByPublisher.length} editoriales`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={stats.productsByPublisher}
            columns={[
              { key: 'code', header: 'Código', render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span> },
              { key: 'name', header: 'Editorial', render: (p) => <span className="font-medium">{p.name}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => (
                  <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'productCount',
                header: 'Productos',
                render: (p) => (
                  <span className="font-semibold text-corporate flex items-center gap-1.5 tabular-nums">
                    <FileText size={14} className="shrink-0" />
                    {p.productCount}
                  </span>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
