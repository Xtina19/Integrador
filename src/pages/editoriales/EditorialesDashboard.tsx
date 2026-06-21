import { useNavigate } from 'react-router-dom'
import { Globe, FileText, BookMarked, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { getPublisherStats } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'

export function EditorialesDashboard() {
  const navigate = useNavigate()
  const stats = getPublisherStats()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Editoriales Activas" value={stats.totalPublishers} detail="Catálogo maestro" icon={<BookMarked size={22} />} />
        <StatCard title="Productos Asociados" value={stats.totalProducts.toLocaleString()} detail="En catálogo" icon={<FileText size={22} />} />
        <StatCard title="Contratos Vigentes" value={stats.activeContracts} detail="Estado activo" icon={<Globe size={22} />} />
        <StatCard title="Contratos por Vencer" value={stats.expiringCount} detail="Próximos 30 días" icon={<AlertTriangle size={22} />} />
      </div>

      {stats.expiringSoon.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader title="Contratos Próximos a Vencer" subtitle="Requieren atención inmediata" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={stats.expiringSoon}
              columns={[
                { key: 'name', header: 'Editorial', render: (p) => <span className="font-medium">{p.name}</span> },
                { key: 'contractExpiry', header: 'Vencimiento', render: (p) => <Badge variant="warning">{p.contractExpiry}</Badge> },
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
    </div>
  )
}
