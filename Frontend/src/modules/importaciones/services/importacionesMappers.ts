/**
 * Mapeo DTO API Importaciones ↔ tipos UI ERP.
 */
import type {
  Consolidation,
  FreightCostDocument,
  ImportPipelineStage,
  ImportStatus,
  InternationalInvoice,
  Shipment,
  ShipmentCosts,
} from '@/types/domain'
import type {
  ConsolidacionDto,
  DocumentoCostoFleteDto,
  EmbarqueDto,
  FacturaInternacionalDto,
  OrdenPendienteEmbarqueDto,
} from './importacionesApi'
import { emptyShipmentCosts } from '@/business-rules/shipmentCosts'

function mapTipoTransporte(tipo: string): Shipment['type'] {
  const t = String(tipo || '').toLowerCase()
  if (t.includes('aéreo') || t.includes('aereo')) return 'Aéreo'
  if (t.includes('courier')) return 'Courier'
  return 'Marítimo'
}

function mapEmbarqueEstado(estado: string): ImportStatus {
  const allowed: ImportStatus[] = [
    'registered',
    'in_transit',
    'customs',
    'received',
    'costed',
    'finalized',
  ]
  if (allowed.includes(estado as ImportStatus)) return estado as ImportStatus
  return 'registered'
}

export function documentoFleteToFreightDocument(dto: DocumentoCostoFleteDto): FreightCostDocument {
  return {
    id: String(dto.id),
    dbId: dto.id,
    code: dto.codigo,
    shipmentId: String(dto.embarqueId),
    shipmentDbId: dto.embarqueId,
    shipmentCode: dto.embarqueCodigo ?? undefined,
    documentNumber: dto.numeroDocumento ?? undefined,
    documentType: dto.tipoDocumento,
    concept: dto.concepto,
    serviceProvider: dto.proveedorServicio,
    documentDate: String(dto.fechaDocumento ?? '').slice(0, 10),
    currency: dto.moneda || 'USD',
    exchangeRate: dto.tasaCambio ?? undefined,
    amount: Number(dto.monto ?? 0),
    localAmount: dto.montoLocal ?? undefined,
    status: dto.status,
    fileName: dto.nombreArchivo ?? undefined,
    hasFile: dto.tieneArchivo ?? false,
    mimeType: dto.mimeType ?? undefined,
    notes: dto.observacion ?? undefined,
  }
}

export function embarqueToShipment(dto: EmbarqueDto): Shipment {
  return {
    id: String(dto.id),
    dbId: dto.id,
    code: dto.codigo,
    type: mapTipoTransporte(dto.tipoTransporte),
    departure: String(dto.fechaDespacho ?? '').slice(0, 10),
    arrival: String(dto.fechaLlegadaEst ?? '').slice(0, 10),
    status: mapEmbarqueEstado(dto.estado),
    boxes: dto.cajas ?? 0,
    origin: dto.origen || dto.paisOrigen,
    destination: dto.destino || 'Santo Domingo, RD',
    supplier: dto.proveedor,
    orderId: dto.codigoOrden ?? (dto.ordenCompraId ? String(dto.ordenCompraId) : undefined),
    orderDbId: dto.ordenCompraId ?? undefined,
    invoiceId: dto.facturaInternacional
      ? String(dto.facturaInternacional.id)
      : undefined,
    invoiceDbId: dto.facturaInternacional?.id,
    consolidationId: dto.consolidacion ? String(dto.consolidacion.id) : undefined,
    consolidationDbId: dto.consolidacion?.id,
    costs: dto.costs ?? emptyShipmentCosts(),
    freightDocuments: (dto.documentosFlete ?? []).map(documentoFleteToFreightDocument),
    notes: dto.observacion ?? undefined,
  }
}

export function facturaDtoToInternationalInvoice(
  dto: FacturaInternacionalDto,
  stage?: ImportPipelineStage,
): InternationalInvoice {
  return {
    id: String(dto.id),
    dbId: dto.id,
    orderId: dto.codigoOrden ?? String(dto.ordenCompraId ?? ''),
    orderDbId: dto.ordenCompraId ?? undefined,
    supplier: dto.proveedor,
    date: String(dto.fechaEmision ?? '').slice(0, 10),
    currency: dto.moneda || 'USD',
    amount: Number(dto.total ?? 0),
    status: dto.status,
    shipmentId: dto.embarqueId ? String(dto.embarqueId) : undefined,
    shipmentDbId: dto.embarqueId,
    shipmentCode: dto.embarqueCodigo ?? undefined,
    stage: (stage ?? dto.stage ?? 'invoice') as ImportPipelineStage,
  }
}

export function consolidacionToConsolidation(dto: ConsolidacionDto): Consolidation {
  return {
    id: String(dto.id),
    dbId: dto.id,
    code: dto.codigo,
    shipmentId: String(dto.embarqueId),
    shipmentDbId: dto.embarqueId,
    warehouseId: String(dto.almacenId),
    warehouseName: dto.almacenNombre ?? undefined,
    date: String(dto.fechaConsolidacion ?? '').slice(0, 10),
    totalBultos: dto.totalBultos,
    status: dto.status,
    notes: dto.observacion ?? undefined,
  }
}

/** OC pendiente → factura virtual para el selector de Registrar Embarque. */
export function ordenPendienteToPendingInvoice(
  dto: OrdenPendienteEmbarqueDto,
): InternationalInvoice {
  return {
    id: `PENDING-OC-${dto.ordenCompraId}`,
    orderId: dto.codigoOrden,
    orderDbId: dto.ordenCompraId,
    supplier: dto.proveedor,
    date: String(dto.fechaOrden ?? '').slice(0, 10),
    currency: dto.monedaId === 1 ? 'DOP' : 'USD',
    amount: dto.total,
    status: 'pending',
    stage: 'invoice',
    pendingEmbarque: true,
  }
}

export function shipmentCostsToApi(costs: ShipmentCosts): ShipmentCosts {
  return { ...costs }
}
