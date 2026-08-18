import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, FileText, Plus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import type { FreightCostDocument } from '@/types/domain'
import { formatMoney } from '@/lib/money'
import { useERP } from '@/store/ERPProvider'
import { importacionesApi } from '@/services/api/importacionesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import {
  FreightDocumentRecordDialog,
  type FreightDocumentFormInput,
} from '@/modules/importaciones/components/FreightDocumentRecordDialog'
import { ShipmentCostsDetailDialog } from '@/modules/importaciones/components/ShipmentCostsDetailDialog'
import { getFreightFile } from '@/modules/importaciones/lib/freightFileStore'
import { hasShipmentCosts } from '@/business-rules/shipmentCosts'

const statusLabel: Record<FreightCostDocument['status'], string> = {
  registered: 'Registrado',
  validated: 'Validado',
  paid: 'Pagado',
  void: 'Anulado',
}

const statusVariant: Record<FreightCostDocument['status'], 'default' | 'success' | 'warning' | 'danger'> = {
  registered: 'default',
  validated: 'warning',
  paid: 'success',
  void: 'danger',
}

export function CostosFletePage() {
  const { state, registerFreightDocument, refreshImportaciones } = useERP()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<FreightCostDocument | null>(null)
  const [initialShipmentId, setInitialShipmentId] = useState<string | undefined>()
  const [viewCostsShipmentId, setViewCostsShipmentId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    const fromQuery = searchParams.get('embarqueId')
    if (!fromQuery) return
    if (!state.shipments.some((s) => s.id === fromQuery || String(s.dbId) === fromQuery)) return
    setInitialShipmentId(fromQuery)
    setEditDoc(null)
    setDialogOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('embarqueId')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, state.shipments])

  const documents = useMemo(() => {
    const fromShipments = state.shipments.flatMap((s) =>
      (s.freightDocuments ?? []).map((d) => ({
        ...d,
        shipmentCode: d.shipmentCode ?? s.code,
      })),
    )
    return fromShipments.sort((a, b) => b.documentDate.localeCompare(a.documentDate))
  }, [state.shipments])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return documents
    return documents.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        (d.shipmentCode ?? '').toLowerCase().includes(q) ||
        (d.documentNumber ?? '').toLowerCase().includes(q) ||
        d.serviceProvider.toLowerCase().includes(q) ||
        d.concept.toLowerCase().includes(q),
    )
  }, [documents, search])

  const viewShipment = viewCostsShipmentId
    ? state.shipments.find((s) => s.id === viewCostsShipmentId)
    : null

  async function handleSave(input: FreightDocumentFormInput) {
    return registerFreightDocument({
      documentId: editDoc?.id,
      ...input,
    })
  }

  async function handleDownload(doc: FreightCostDocument) {
    setDownloadError('')
    try {
      if (doc.dbId && doc.hasFile) {
        const { blob, fileName } = await importacionesApi.downloadDocumentoFleteArchivo(doc.dbId)
        const url = URL.createObjectURL(blob)
        const anchor = window.document.createElement('a')
        anchor.href = url
        anchor.download = fileName
        anchor.click()
        URL.revokeObjectURL(url)
        return
      }
      const local = getFreightFile(doc.id)
      if (!local) {
        setDownloadError('El archivo no está disponible para descarga.')
        return
      }
      const url = URL.createObjectURL(local.blob)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = local.fileName
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setDownloadError(getFriendlyErrorMessage(e))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código, embarque, proveedor o concepto..."
            actions={
              <button
                type="button"
                onClick={() => {
                  setEditDoc(null)
                  setDialogOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-corporate rounded-lg hover:bg-corporate/90"
              >
                <Plus size={16} />
                Registrar documento
              </button>
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Documentos de Costo de Flete"
          subtitle={`${filtered.length} documento${filtered.length === 1 ? '' : 's'} — facturas, BL, guías y recibos de flete por embarque`}
        />
        <CardBody className="!p-0">
          {downloadError && (
            <div className="mx-4 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {downloadError}
            </div>
          )}
          <Table
            keyField="id"
            data={filtered as (FreightCostDocument & Record<string, unknown>)[]}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (d) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{d.code}</span>
                  </div>
                ),
              },
              { key: 'shipmentCode', header: 'Embarque', render: (d) => <span className="font-mono text-xs">{d.shipmentCode}</span> },
              { key: 'documentType', header: 'Tipo', render: (d) => <span className="text-sm">{d.documentType}</span> },
              { key: 'documentNumber', header: 'Nº doc.', render: (d) => <span className="font-mono text-xs">{d.documentNumber ?? '—'}</span> },
              { key: 'concept', header: 'Concepto', render: (d) => <span className="text-sm">{d.concept}</span> },
              { key: 'serviceProvider', header: 'Proveedor', render: (d) => <span className="text-sm">{d.serviceProvider}</span> },
              {
                key: 'amount',
                header: 'Monto',
                render: (d) => (
                  <span className="font-semibold tabular-nums">{formatMoney(d.amount, d.currency)}</span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (d) => <Badge variant={statusVariant[d.status]}>{statusLabel[d.status]}</Badge>,
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (d) => (
                  <div className="flex items-center gap-1">
                    {(d.hasFile || getFreightFile(d.id)) && (
                      <button
                        type="button"
                        onClick={() => void handleDownload(d)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-corporate hover:bg-corporate/5 transition-colors"
                        title="Descargar archivo desde BD"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <TableActions
                      onView={() => {
                        const sh = state.shipments.find((s) => s.id === d.shipmentId)
                        if (sh?.costs && hasShipmentCosts(sh.costs)) setViewCostsShipmentId(sh.id)
                      }}
                      onEdit={() => {
                        setEditDoc(d)
                        setDialogOpen(true)
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FreightDocumentRecordDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditDoc(null)
          setInitialShipmentId(undefined)
          void refreshImportaciones()
        }}
        shipments={state.shipments}
        initialShipmentId={initialShipmentId}
        document={editDoc}
        onSave={handleSave}
      />

      {viewShipment?.costs && (
        <ShipmentCostsDetailDialog
          open={Boolean(viewShipment)}
          onClose={() => setViewCostsShipmentId(null)}
          shipmentCode={viewShipment.code}
          invoiceId={viewShipment.invoiceId}
          costs={viewShipment.costs}
          documents={viewShipment.freightDocuments}
        />
      )}
    </div>
  )
}
