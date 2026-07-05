import { useState, useMemo } from 'react'
import { DollarSign } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import type { Shipment } from '@/types/domain'
import { computeShipmentCostsTotal, hasShipmentCosts } from '@/business-rules/shipmentCosts'
import { ShipmentCostsDetailDialog } from '@/modules/importaciones/components/ShipmentCostsDetailDialog'
import { useERP } from '@/store/ERPProvider'

function formatCurrency(value: number) {
  return `RD$${value.toLocaleString()}`
}

export function CostosFletePage() {
  const { state } = useERP()
  const [search, setSearch] = useState('')
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const rows = useMemo(() => {
    return state.shipments
      .filter((s) => hasShipmentCosts(s.costs))
      .map((s) => ({
        ...s,
        invoiceLabel: s.invoiceId ?? '—',
        totalCosts: computeShipmentCostsTotal(s.costs!),
        costStatus: 'calculated' as const,
      }))
  }, [state.shipments])

  const filtered = useMemo(() => {
    return rows.filter(
      (s) =>
        search === '' ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        (s.invoiceId ?? '').toLowerCase().includes(search.toLowerCase())
    )
  }, [rows, search])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por embarque o factura..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Costos de Flete"
          subtitle={`${filtered.length} embarques con costos registrados`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered as (Shipment & { invoiceLabel: string; totalCosts: number; costStatus: string } & Record<string, unknown>)[]}
            columns={[
              {
                key: 'code',
                header: 'Embarque',
                render: (s) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <DollarSign size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{s.code}</span>
                  </div>
                ),
              },
              {
                key: 'invoiceId',
                header: 'Factura',
                render: (s) => <span className="font-mono text-xs">{s.invoiceLabel}</span>,
              },
              {
                key: 'totalCosts',
                header: 'Total Costos',
                render: (s) => (
                  <span className="font-semibold text-corporate">{formatCurrency(s.totalCosts)}</span>
                ),
              },
              {
                key: 'costStatus',
                header: 'Estado',
                render: () => <Badge variant="success">Calculado</Badge>,
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s) => (
                  <TableActions
                    onView={() => {
                      if (s.costs) setSelectedShipment(s)
                    }}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      {selectedShipment?.costs && (
        <ShipmentCostsDetailDialog
          open={Boolean(selectedShipment)}
          onClose={() => setSelectedShipment(null)}
          shipmentCode={selectedShipment.code}
          invoiceId={selectedShipment.invoiceId}
          costs={selectedShipment.costs}
        />
      )}
    </div>
  )
}
