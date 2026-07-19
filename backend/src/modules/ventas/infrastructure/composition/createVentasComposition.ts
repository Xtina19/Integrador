import { VentaApplicationService } from '../../application/services/VentaApplicationService'
import {
  AnularNotaCreditoHandler,
  AnularVentaHandler,
  BuscarClienteHandler,
  EmitirNotaCreditoHandler,
  EmitirVentaHandler,
  ListarNotasCreditoDisponiblesHandler,
  ListarNotasCreditoHandler,
  ListarVentasHandler,
  ObtenerHistorialVentaHandler,
  ObtenerVentaHandler,
  RegistrarCambioHandler,
  ReimprimirVentaHandler,
  RevertirAplicacionesNotaCreditoHandler,
} from '../../application/handlers'
import type { VentaRepository } from '../../domain/ports/VentaRepository'
import type { InventarioComposition } from '../../../inventario/infrastructure/composition/createInventarioComposition'
import { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'
import { InMemoryVentaRepository } from '../persistence/InMemoryVentaRepository'
import { MysqlVentaRepository } from '../persistence/mysql/MysqlVentaRepository'
import type { SqlExecutor } from '../persistence/sql/SqlExecutor'
import {
  EngineInventarioConsultaAdapter,
  EngineInventarioEfectosAdapter,
  InMemoryAuditoriaComercialAdapter,
  InMemoryClienteConsultaAdapter,
  InMemoryProductoConsultaAdapter,
  InMemoryUsuarioPermisosAdapter,
  SequentialIdGeneratorAdapter,
  UuidIdGeneratorAdapter,
} from '../adapters'
import { seedVentasJoselito } from './seedVentasJoselito'

export interface VentasComposition {
  store: InMemoryVentasStore
  /** Persistencia activa (in-memory o MySQL). */
  ventas: VentaRepository
  ventaService: VentaApplicationService
  /** Puerto de permisos — usado por middleware HTTP de autorización. */
  permisos: InMemoryUsuarioPermisosAdapter
  auditoria: InMemoryAuditoriaComercialAdapter
  /**
   * ACL de identidad de clientes (solo id/nombre/activo).
   * El maestro editable vive en Administración (FE); aquí no hay catálogo duplicado.
   */
  clientes: InMemoryClienteConsultaAdapter
  /** Composición Inventario compartida (Engine) — obligatoria en runtime montado. */
  inventario?: InventarioComposition
  handlers: {
    emitirVenta: EmitirVentaHandler
    listarVentas: ListarVentasHandler
    obtenerVenta: ObtenerVentaHandler
    obtenerHistorial: ObtenerHistorialVentaHandler
    buscarCliente: BuscarClienteHandler
    listarNotasCreditoDisponibles: ListarNotasCreditoDisponiblesHandler
    listarNotasCredito: ListarNotasCreditoHandler
    reimprimir: ReimprimirVentaHandler
    registrarCambio: RegistrarCambioHandler
    emitirNotaCredito: EmitirNotaCreditoHandler
    anularNotaCredito: AnularNotaCreditoHandler
    revertirAplicacionesNotaCredito: RevertirAplicacionesNotaCreditoHandler
    anularVenta: AnularVentaHandler
  }
}

/**
 * Composition root de infraestructura Ventas (puertos → adaptadores).
 * HTTP se monta aparte vía `mountVentasModule` / `createVentasHttpApp`.
 *
 * Inventario: cuando se provee `inventario`, los efectos/consulta van al Engine
 * compartido (sin stub local de existencias).
 */
export function createVentasComposition(options?: {
  sequentialIds?: boolean
  seedJoselito?: boolean
  inventarioForzarError?: string
  /** Si se provee, usa MySQL definitivo para `VentaRepository`. */
  sql?: SqlExecutor
  /** Composition Inventario compartida — Production path. */
  inventario?: InventarioComposition
}): VentasComposition {
  const store = new InMemoryVentasStore()
  if (options?.seedJoselito !== false) {
    seedVentasJoselito(store)
  }

  const ventas: VentaRepository = options?.sql
    ? new MysqlVentaRepository(options.sql)
    : new InMemoryVentaRepository(store)
  const ids = options?.sequentialIds
    ? new SequentialIdGeneratorAdapter()
    : new UuidIdGeneratorAdapter()

  const permisos = new InMemoryUsuarioPermisosAdapter(store)
  const clientes = new InMemoryClienteConsultaAdapter(store)

  if (!options?.inventario) {
    throw new Error(
      'createVentasComposition requiere `inventario` (Inventory Engine). El stub local fue eliminado.',
    )
  }

  if (options.inventarioForzarError) {
    throw new Error(
      'inventarioForzarError ya no aplica: el stub de inventario fue eliminado. Use el Engine real.',
    )
  }

  const bridge = options.inventario.engineBridge
  const inventarioConsulta = new EngineInventarioConsultaAdapter(
    bridge.existencias,
    bridge.almacenes,
  )
  const inventarioEfectos = new EngineInventarioEfectosAdapter(bridge)

  const ventaService = new VentaApplicationService({
    ventas,
    clientes,
    productos: new InMemoryProductoConsultaAdapter(store),
    inventarioConsulta,
    inventarioEfectos,
    permisos,
    ids,
  })

  const auditoria = new InMemoryAuditoriaComercialAdapter(store)

  return {
    store,
    ventas,
    ventaService,
    permisos,
    auditoria,
    clientes,
    inventario: options.inventario,
    handlers: {
      emitirVenta: new EmitirVentaHandler(ventaService),
      listarVentas: new ListarVentasHandler(ventaService),
      obtenerVenta: new ObtenerVentaHandler(ventaService),
      obtenerHistorial: new ObtenerHistorialVentaHandler(ventaService),
      buscarCliente: new BuscarClienteHandler(ventaService),
      listarNotasCreditoDisponibles: new ListarNotasCreditoDisponiblesHandler(ventaService),
      listarNotasCredito: new ListarNotasCreditoHandler(ventaService),
      reimprimir: new ReimprimirVentaHandler(ventaService),
      registrarCambio: new RegistrarCambioHandler(ventaService),
      emitirNotaCredito: new EmitirNotaCreditoHandler(ventaService),
      anularNotaCredito: new AnularNotaCreditoHandler(ventaService),
      revertirAplicacionesNotaCredito: new RevertirAplicacionesNotaCreditoHandler(ventaService),
      anularVenta: new AnularVentaHandler(ventaService),
    },
  }
}
