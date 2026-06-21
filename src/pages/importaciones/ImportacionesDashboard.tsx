import { useNavigate } from 'react-router-dom'
import { Ship, Package, DollarSign, Globe } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { importStats, shipments, shipmentStatusMap } from '../../data/importsMockData'

export function ImportacionesDashboard() {
  const navigate = useNavigate()
  const inTransit = shipments.filter((s) => s.status === 'in_transit')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Embarques Activos"
          value={importStats.activeShipments}
          detail="En tránsito o aduana"
          icon={<Ship size={22} />}
        />
        <StatCard
          title="Cajas en Tránsito"
          value={importStats.boxesInTransit}
          detail="Unidades pendientes"
          icon={<Package size={22} />}
        />
        <StatCard
          title="Costo Promedio"
          value={`$${importStats.avgCost.toFixed(2)}`}
          detail="Por libro costeado"
          icon={<DollarSign size={22} />}
        />
        <StatCard
          title="Importaciones del Año"
          value={importStats.yearlyImports}
          detail="Embarques registrados 2026"
          icon={<Globe size={22} />}
        />
      </div>

      {inTransit.length > 0 && (
        <Card>
          <CardHeader
            title="Embarques en Tránsito"
            subtitle="Seguimiento activo"
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/importaciones/embarques')}>
                Ver todos
              </Button>
            }
          />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={inTransit}
              columns={[
                { key: 'code', header: 'Código', render: (s) => <span className="font-mono text-xs text-corporate">{s.code}</span> },
                { key: 'type', header: 'Tipo' },
                { key: 'origin', header: 'Origen', className: 'text-sm' },
                { key: 'destination', header: 'Destino', className: 'text-sm' },
                { key: 'arrival', header: 'Llegada estimada', className: 'text-sm' },
                { key: 'boxes', header: 'Cajas', render: (s) => <span className="font-semibold">{s.boxes}</span> },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (s) => {
                    const cfg = shipmentStatusMap[s.status]
                    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  },
                },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
