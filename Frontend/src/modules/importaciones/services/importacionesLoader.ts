/**
 * Carga agregada Importaciones desde API para hidratar ERPState.
 */
import { importacionesApi } from './importacionesApi'
import {
  consolidacionToConsolidation,
  embarqueToShipment,
  facturaDtoToInternationalInvoice,
  ordenPendienteToPendingInvoice,
} from './importacionesMappers'
import type { Consolidation, InternationalInvoice, Shipment } from '@/types/domain'

export async function loadImportacionesFromApi(): Promise<{
  shipments: Shipment[]
  internationalInvoices: InternationalInvoice[]
  consolidations: Consolidation[]
}> {
  const [embarquesPage, facturas, consolidaciones, pendientes] = await Promise.all([
    importacionesApi.listEmbarques({ pageSize: 500 }).catch(() => ({
      data: [],
      page: 1,
      pageSize: 0,
      total: 0,
    })),
    importacionesApi.listFacturasInternacionales().catch(() => []),
    importacionesApi.listConsolidaciones().catch(() => []),
    importacionesApi.listOrdenesPendientes().catch(() => []),
  ])

  const shipments = embarquesPage.data.map(embarqueToShipment)

  const invoiceByEmbarque = new Map<number, InternationalInvoice>()
  for (const f of facturas) {
    invoiceByEmbarque.set(
      f.embarqueId,
      facturaDtoToInternationalInvoice(f, f.stage as InternationalInvoice['stage']),
    )
  }

  for (const emb of embarquesPage.data) {
    if (emb.facturaInternacional && !invoiceByEmbarque.has(emb.id)) {
      invoiceByEmbarque.set(
        emb.id,
        facturaDtoToInternationalInvoice(emb.facturaInternacional, emb.pipelineStage as InternationalInvoice['stage']),
      )
    }
  }

  const pendingInvoices = pendientes.map(ordenPendienteToPendingInvoice)

  return {
    shipments,
    internationalInvoices: [...invoiceByEmbarque.values(), ...pendingInvoices],
    consolidations: consolidaciones.map(consolidacionToConsolidation),
  }
}
