import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { BookCostingEntry } from '@/types/domain'
import { hasShipmentCosts } from '@/business-rules/shipmentCosts'
import { useERP } from '@/store/ERPProvider'
import {
  BOOK_COSTING_MARGIN_PERCENT,
  bookCostingRowKey,
  clampBookCostingMargin,
} from '@/modules/importaciones/business-rules/bookCosting'
import { formatDop } from '@/lib/money'
import { useToast } from '@/context/ToastContext'

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

export function CosteoLibroPage() {
  const { state, applyImportCosting, updateBookCostingMargin } = useERP()
  const { showSuccess, showError } = useToast()
  const [search, setSearch] = useState('')
  const [applying, setApplying] = useState(false)
  const [bulkMargin, setBulkMargin] = useState(String(BOOK_COSTING_MARGIN_PERCENT))

  const shipmentsWithCosts = useMemo(
    () => state.shipments.filter((s) => hasShipmentCosts(s.costs)),
    [state.shipments],
  )

  const [selectedShipmentId, setSelectedShipmentId] = useState(
    () => shipmentsWithCosts[0]?.id ?? '',
  )

  const selectedShipment = state.shipments.find((s) => s.id === selectedShipmentId)

  const filtered = useMemo(() => {
    return state.bookCosting.filter((b) => {
      const matchShipment = !selectedShipmentId || b.shipmentId === selectedShipmentId
      const matchSearch =
        search === '' ||
        (b.isbn ?? '').includes(search) ||
        (b.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (b.orderId ?? '').toLowerCase().includes(search.toLowerCase())
      return matchShipment && matchSearch
    })
  }, [search, state.bookCosting, selectedShipmentId])

  const pendingRows = useMemo(
    () => filtered.filter((b) => !b.appliedToInventory),
    [filtered],
  )
  const pendingCount = pendingRows.length
  const allApplied = filtered.length > 0 && pendingCount === 0

  useEffect(() => {
    const sample = state.bookCosting.find(
      (b) => b.shipmentId === selectedShipmentId && !b.appliedToInventory,
    )
    setBulkMargin(String(sample?.marginPercent ?? BOOK_COSTING_MARGIN_PERCENT))
  }, [selectedShipmentId])

  async function handleApplyToInventory() {
    if (!selectedShipmentId) return
    setApplying(true)
    try {
      const result = await applyImportCosting(selectedShipmentId)
      if (!result.success) {
        showError(result.errors?.join(' ') ?? 'No se pudo aplicar el costeo.')
        return
      }
      showSuccess('Costeo aplicado: costo de referencia y precio de venta actualizados en inventario.')
    } finally {
      setApplying(false)
    }
  }

  function handleRowMargin(entry: BookCostingEntry, raw: string) {
    if (!selectedShipmentId || entry.appliedToInventory) return
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    updateBookCostingMargin({
      shipmentId: selectedShipmentId,
      rowKey: bookCostingRowKey(entry),
      marginPercent: clampBookCostingMargin(parsed),
    })
  }

  function handleApplyMarginToAll() {
    if (!selectedShipmentId || pendingCount === 0) return
    const marginPercent = clampBookCostingMargin(Number(bulkMargin))
    updateBookCostingMargin({
      shipmentId: selectedShipmentId,
      marginPercent,
      applyToAllPending: true,
    })
    setBulkMargin(String(marginPercent))
    showSuccess(`Margen ${marginPercent}% aplicado a ${pendingCount} libro(s).`)
  }

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
            <div className="flex flex-wrap items-end gap-3 md:ml-auto">
              <div className="w-36">
                <Input
                  label="Margen de ganancia (%)"
                  type="number"
                  min={0}
                  max={999}
                  step={0.5}
                  value={bulkMargin}
                  onChange={(e) => setBulkMargin(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                disabled={!selectedShipmentId || pendingCount === 0}
                onClick={handleApplyMarginToAll}
                title={
                  pendingCount === 0
                    ? 'No hay libros pendientes en este embarque'
                    : 'Aplicar el margen a todos los libros pendientes'
                }
              >
                Aplicar a todos
              </Button>
              <Button
                variant="primary"
                disabled={!selectedShipmentId || pendingCount === 0 || applying}
                onClick={() => void handleApplyToInventory()}
              >
                {applying ? 'Aplicando…' : `Aplicar a inventario (${pendingCount})`}
              </Button>
              <Link to="/inventario/costeo/nuevo">
                <Button variant="outline" icon={ExternalLink}>
                  Costeo inventario
                </Button>
              </Link>
            </div>
          </div>
          {pendingCount === 0 && selectedShipmentId && (
            <p className="mt-3 text-sm text-gray-500">
              {filtered.length === 0
                ? 'Este embarque aún no tiene líneas de costeo por libro. Puede editar el margen (%); «Aplicar a todos» se habilita cuando existan libros pendientes.'
                : 'Todos los libros de este embarque ya están aplicados a inventario. El margen solo se edita en libros pendientes.'}
            </p>
          )}
          {allApplied && (
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
              <CheckCircle2 size={16} />
              Costeo sincronizado con inventario. Los registros aparecen en Inventario → Costeo.
            </div>
          )}
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
              ? 'Costo unitario (producto + flete). El margen de ganancia se define por libro y calcula el precio de venta.'
              : 'Seleccione un embarque con costos registrados'
          }
        />
        <CardBody className="!p-0">
          <Table
            keyField="rowKey"
            data={filtered.map((b) => ({ ...b, rowKey: bookCostingRowKey(b) })) as (BookCostingEntry & { rowKey: string } & Record<string, unknown>)[]}
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
              {
                key: 'previousCost',
                header: 'Costo inventario',
                render: (b) => (
                  <span className="text-sm text-gray-600">{formatUsd(b.previousCost ?? 0)}</span>
                ),
              },
              { key: 'productCost', header: 'Costo producto', render: (b) => <span className="text-sm">{formatUsd(b.productCost)}</span> },
              { key: 'freightAlloc', header: 'Flete asignado', render: (b) => <span className="text-sm">{formatUsd(b.freightAlloc)}</span> },
              { key: 'finalCost', header: 'Costo total', render: (b) => <span className="font-semibold text-corporate">{formatUsd(b.finalCost)}</span> },
              {
                key: 'marginPercent',
                header: 'Ganancia %',
                render: (b) => (
                  <div className="w-24" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      step={0.5}
                      disabled={Boolean(b.appliedToInventory)}
                      value={b.marginPercent}
                      onChange={(e) => {
                        if (e.target.value === '') return
                        handleRowMargin(b, e.target.value)
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') handleRowMargin(b, String(BOOK_COSTING_MARGIN_PERCENT))
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm tabular-nums text-gray-900 focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20 disabled:bg-gray-50 disabled:text-gray-500"
                      aria-label={`Margen de ganancia de ${b.title}`}
                    />
                  </div>
                ),
              },
              {
                key: 'salePrice',
                header: 'Precio venta',
                render: (b) => (
                  <span className="font-bold text-emerald-700 tabular-nums">{formatDop(b.salePrice ?? 0)}</span>
                ),
              },
              {
                key: 'appliedToInventory',
                header: 'Inventario',
                render: (b) =>
                  b.appliedToInventory ? (
                    <Badge variant="success">Aplicado</Badge>
                  ) : (
                    <Badge variant="warning">Pendiente</Badge>
                  ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
