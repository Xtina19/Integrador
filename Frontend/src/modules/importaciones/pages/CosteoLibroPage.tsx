import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import type { BookCostingEntry } from '@/types/domain'
import { computeShipmentCostsTotal, hasShipmentCosts } from '@/business-rules/shipmentCosts'
import { useERP } from '@/store/ERPProvider'
import { formatDop } from '@/lib/money'

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

export function CosteoLibroPage() {
  const { state } = useERP()
  const [search, setSearch] = useState('')

  const shipmentsWithCosts = useMemo(
    () => state.shipments.filter((s) => hasShipmentCosts(s.costs)),
    [state.shipments]
  )

  const [selectedShipmentId, setSelectedShipmentId] = useState(
    () => shipmentsWithCosts[0]?.id ?? ''
  )

  const selectedShipment = state.shipments.find((s) => s.id === selectedShipmentId)
  const freightTotal = selectedShipment?.costs ? computeShipmentCostsTotal(selectedShipment.costs) : 0

  const filtered = useMemo(() => {
    return state.bookCosting.filter((b) => {
      const matchShipment = !selectedShipmentId || b.shipmentId === selectedShipmentId
      const matchSearch =
        search === '' ||
        b.isbn.includes(search) ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        (b.orderId ?? '').toLowerCase().includes(search.toLowerCase())
      return matchShipment && matchSearch
    })
  }, [search, state.bookCosting, selectedShipmentId])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Select
              label="Embarque"
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              options={
                shipmentsWithCosts.length
                  ? shipmentsWithCosts.map((s) => ({
                      value: s.id,
                      label: `${s.code}${s.invoiceId ? ` — ${s.invoiceId}` : ''}`,
                    }))
                  : [{ value: '', label: 'Sin embarques con costos' }]
              }
              className="md:w-80"
            />
            {selectedShipment?.costs && (
              <div className="flex-1 text-sm bg-surface border border-gray-100 rounded-lg px-4 py-3">
                <span className="text-gray-500">Total costos del embarque aplicado al costeo:</span>{' '}
                <span className="font-bold text-corporate tabular-nums">{formatDop(freightTotal)}</span>
                <span className="text-gray-400 mx-2">·</span>
                <span className="text-gray-500">Distribuido entre {filtered.length} líneas de producto</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por ISBN, título u orden..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Costeo por Libro"
          subtitle={
            selectedShipment
              ? `Costos de ${selectedShipment.code} distribuidos proporcionalmente`
              : 'Seleccione un embarque con costos registrados'
          }
        />
        <CardBody className="!p-0">
          <Table
            keyField="title"
            data={filtered as (BookCostingEntry & Record<string, unknown>)[]}
            columns={[
              {
                key: 'isbn',
                header: 'ISBN',
                render: (b) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Calculator size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{b.isbn || '—'}</span>
                  </div>
                ),
              },
              { key: 'title', header: 'Título', render: (b) => <span className="font-medium">{b.title}</span> },
              { key: 'orderId', header: 'Orden', render: (b) => <span className="font-mono text-xs">{b.orderId ?? '—'}</span> },
              { key: 'productCost', header: 'Costo producto', render: (b) => <span className="text-sm">{formatUsd(b.productCost)}</span> },
              { key: 'freightAlloc', header: 'Flete asignado', render: (b) => <span className="text-sm">{formatUsd(b.freightAlloc)}</span> },
              { key: 'finalCost', header: 'Costo final', render: (b) => <span className="font-semibold text-corporate">{formatUsd(b.finalCost)}</span> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
