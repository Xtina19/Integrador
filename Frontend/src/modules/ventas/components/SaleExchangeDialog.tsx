import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, FileText, Receipt } from 'lucide-react'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { posProducts } from '@/mocks/mockVentas'
import { useSalesData, type SaleRecord } from '@/context/SalesDataContext'
import { formatDop } from '@/modules/ventas/utils/ventasUi'
import {
  computeExchangeDifference,
  formatPriceDifference,
  getMaxExchangeQty,
} from '@/modules/ventas/utils/salesExchange'
import { EXCHANGE_REASONS, type ExchangeDialogTab } from '@/modules/ventas/types/salesExchange'

const TABS: { id: ExchangeDialogTab; label: string }[] = [
  { id: 'factura', label: 'Factura' },
  { id: 'cambio', label: 'Cambio' },
  { id: 'resultado', label: 'Resultado' },
]

interface SaleExchangeDialogProps {
  open: boolean
  onClose: () => void
  initialSale?: SaleRecord | null
  onCompleted?: () => void
}

export function SaleExchangeDialog({ open, onClose, initialSale, onCompleted }: SaleExchangeDialogProps) {
  const { salesHistory, registerProductExchange, productExchanges } = useSalesData()

  const [activeTab, setActiveTab] = useState<ExchangeDialogTab>('factura')
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [originalProductId, setOriginalProductId] = useState('')
  const [newProductId, setNewProductId] = useState('')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState<string>(EXCHANGE_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveTab('factura')
    setSelectedSale(initialSale ?? null)
    setInvoiceSearch(initialSale?.id ?? '')
    setOriginalProductId(initialSale?.items[0]?.productId ?? '')
    setNewProductId(posProducts[0]?.id ?? '')
    setQty('1')
    setReason(EXCHANGE_REASONS[0])
    setCustomReason('')
    setError('')
    setCompleted(false)
  }, [open, initialSale])

  useEffect(() => {
    if (selectedSale) {
      setOriginalProductId(selectedSale.items[0]?.productId ?? '')
    }
  }, [selectedSale])

  const paidSales = useMemo(() => salesHistory.filter((s) => s.status === 'paid'), [salesHistory])

  const searchResults = useMemo(() => {
    if (!invoiceSearch.trim()) return paidSales.slice(0, 5)
    const q = invoiceSearch.toLowerCase()
    return paidSales.filter(
      (s) => s.id.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q)
    )
  }, [invoiceSearch, paidSales])

  const originalItem = selectedSale?.items.find((i) => i.productId === originalProductId)
  const newProduct = posProducts.find((p) => p.id === newProductId)
  const maxQty =
    originalItem && selectedSale
      ? getMaxExchangeQty(originalItem, selectedSale.id, originalProductId, productExchanges)
      : 0
  const numQty = Math.max(0, parseInt(qty, 10) || 0)

  const priceDiff =
    originalItem && newProduct ? computeExchangeDifference(originalItem.unitPrice, newProduct.price, numQty) : 0
  const diffInfo = formatPriceDifference(priceDiff)
  const resolvedReason = reason === 'Otro' ? customReason.trim() : reason

  function handleSelectInvoice(sale: SaleRecord) {
    setSelectedSale(sale)
    setInvoiceSearch(sale.id)
    setError('')
  }

  function validateCambio(): boolean {
    if (!selectedSale) {
      setError('Seleccione una factura existente.')
      setActiveTab('factura')
      return false
    }
    if (!originalItem || !newProduct) {
      setError('Seleccione los productos del cambio.')
      return false
    }
    if (numQty <= 0) {
      setError('La cantidad debe ser mayor a cero.')
      return false
    }
    if (numQty > maxQty) {
      setError('No puede cambiar una cantidad mayor a la comprada.')
      return false
    }
    if (!resolvedReason) {
      setError('Indique el motivo del cambio.')
      return false
    }
    setError('')
    return true
  }

  function handleRegister(generateCreditNote: boolean) {
    if (!validateCambio() || !selectedSale || !originalItem || !newProduct) return

    const result = registerProductExchange({
      invoiceId: selectedSale.id,
      originalProductId: originalItem.productId,
      originalProductTitle: originalItem.title,
      originalUnitPrice: originalItem.unitPrice,
      newProductId: newProduct.id,
      newProductTitle: newProduct.title,
      newUnitPrice: newProduct.price,
      qty: numQty,
      reason: resolvedReason,
      generateCreditNote,
      user: selectedSale.cashier,
    })

    if (!result.success) {
      setError(result.errors?.[0] ?? 'No se pudo registrar el cambio.')
      return
    }

    setCompleted(true)
    onCompleted?.()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Nuevo Cambio"
      subtitle={selectedSale?.id ?? 'Busque una factura para iniciar'}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-1 bg-surface rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'cambio' && !selectedSale) {
                  setError('Primero seleccione una factura.')
                  return
                }
                if (tab.id === 'resultado' && !validateCambio()) return
                setActiveTab(tab.id)
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</div>
        )}

        {activeTab === 'factura' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Input
                label="Buscar factura"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="Número de factura o cliente..."
              />
              <div className="rounded-lg border border-gray-100 divide-y divide-gray-50 max-h-40 overflow-y-auto">
                {searchResults.map((sale) => (
                  <button
                    key={sale.id}
                    type="button"
                    onClick={() => handleSelectInvoice(sale)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface transition-colors ${
                      selectedSale?.id === sale.id ? 'bg-corporate/5 text-corporate' : 'text-gray-700'
                    }`}
                  >
                    <span className="font-mono font-medium">{sale.id}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    {sale.date}
                    <span className="text-gray-400 mx-2">·</span>
                    {formatDop(sale.total)}
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No se encontraron facturas pagadas</p>
                )}
              </div>
            </div>

            {selectedSale && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-gray-100 p-4 bg-surface">
                  <DetailRow label="Número" value={<span className="font-mono">{selectedSale.id}</span>} />
                  <DetailRow label="Fecha" value={selectedSale.date} />
                  <DetailRow label="Método de pago" value={selectedSale.paymentMethod} />
                  <DetailRow label="Usuario" value={selectedSale.cashier} />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Productos vendidos</h4>
                  <Table
                    keyField="code"
                    data={selectedSale.items.map((item) => ({
                      ...item,
                      lineTotal: item.qty * item.unitPrice,
                    }))}
                    columns={[
                      { key: 'title', header: 'Producto', render: (r) => <span className="font-medium">{r.title}</span> },
                      { key: 'code', header: 'Código', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
                      { key: 'qty', header: 'Cantidad' },
                      { key: 'unitPrice', header: 'Precio', render: (r) => formatDop(r.unitPrice) },
                      {
                        key: 'lineTotal',
                        header: 'Total',
                        render: (r) => (
                          <span className="font-semibold text-corporate">{formatDop(r.lineTotal)}</span>
                        ),
                      },
                    ]}
                  />
                </div>

                <div className="flex justify-end">
                  <Button icon={ChevronRight} onClick={() => setActiveTab('cambio')}>
                    Continuar al cambio
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'cambio' && selectedSale && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Producto entregado *"
                value={originalProductId}
                onChange={(e) => {
                  setOriginalProductId(e.target.value)
                  setQty('1')
                }}
                options={selectedSale.items.map((item) => ({
                  value: item.productId,
                  label: `${item.title} (máx. ${getMaxExchangeQty(item, selectedSale.id, item.productId, productExchanges)})`,
                }))}
              />
              <Select
                label="Producto nuevo *"
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                options={posProducts.map((p) => ({
                  value: p.id,
                  label: `${p.title} — ${formatDop(p.price)}`,
                }))}
              />
              <Input
                label="Cantidad *"
                type="number"
                min={1}
                max={maxQty || 1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              <Select
                label="Motivo *"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                options={EXCHANGE_REASONS.map((r) => ({ value: r, label: r }))}
              />
              {reason === 'Otro' && (
                <Input
                  label="Especifique el motivo *"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="md:col-span-2"
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button icon={ChevronRight} onClick={() => validateCambio() && setActiveTab('resultado')}>
                Ver resultado
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'resultado' && selectedSale && (
          <div className="space-y-6">
            {completed ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                El cambio fue registrado correctamente.
                {diffInfo.type === 'credit' && ' Se generó la Nota de Crédito correspondiente.'}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-surface p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Resumen del cambio</p>
                  <DetailRow label="Factura" value={<span className="font-mono">{selectedSale.id}</span>} />
                  <DetailRow label="Producto entregado" value={originalItem?.title ?? '—'} />
                  <DetailRow label="Producto nuevo" value={newProduct?.title ?? '—'} />
                  <DetailRow label="Cantidad" value={numQty} />
                  <DetailRow label="Motivo" value={resolvedReason || '—'} />
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-600">{diffInfo.label}</p>
                    {diffInfo.type !== 'none' && (
                      <p
                        className={`text-xl font-bold mt-1 ${
                          diffInfo.type === 'credit' ? 'text-emerald-600' : 'text-corporate'
                        }`}
                      >
                        {formatDop(diffInfo.amount)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {diffInfo.type === 'credit' && (
                    <Button icon={Receipt} onClick={() => handleRegister(true)}>
                      Generar Nota de Crédito
                    </Button>
                  )}
                  {(diffInfo.type === 'none' || diffInfo.type === 'charge') && (
                    <Button icon={FileText} onClick={() => handleRegister(false)}>
                      Confirmar Cambio
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </FormDialog>
  )
}
