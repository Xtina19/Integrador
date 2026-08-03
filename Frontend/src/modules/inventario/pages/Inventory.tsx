import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InventoryDashboard } from '../components/InventoryDashboard'
import { InventoryTabNav } from '../components/InventoryTabNav'
import type {
  AuditoriaInventarioVista,
  InventoryLegacyTabId,
  InventoryTabId,
  KardexLineaVista,
  MovimientoFiltroId,
  MovimientoVista,
  ProductoInventarioVista,
  InventoryDashboardKpis,
  TransferenciaVista
} from '../types/inventoryUi'
import { GeneralTab } from '../tabs/GeneralTab'
import { MovimientosTab } from '../tabs/MovimientosTab'
import { KardexTab } from '../tabs/KardexTab'
import { AuditoriaTab } from '../tabs/AuditoriaTab'
import { movimientosApi } from '@/services/api/movimientosApi'
import { kardexApi } from '@/services/api/kardexApi'
import { auditoriaInventarioApi } from '@/services/api/auditoriaInventarioApi'
import { inventarioQueryApi } from '@/services/api/inventarioQueryApi'
import { MOVIMIENTO_CONTEXT } from '../utils/movimientosContext'
import { TransferenciasTab } from '../tabs/TransferenciasTab'
import { transferenciasApi } from '@/services/api/transferenciasApi'

const VALID_TABS: InventoryTabId[] = ['general', 'movimientos', 'transferencias', 'kardex', 'auditoria']

const LEGACY_TAB_TO_FILTRO: Record<InventoryLegacyTabId, MovimientoFiltroId> = {
  conteos: 'conteos',
  ajustes: 'ajustes',
  descartes: 'descartes',
}

const VALID_FILTROS: MovimientoFiltroId[] = [
  'all',
  'entradas',
  'salidas',
  'transferencias',
  'conteos',
  'ajustes',
  'descartes',
  'compensaciones',
]

const EMPTY_KPIS: InventoryDashboardKpis = {
  stockTotal: 0,
  productosBajoStock: 0,
  productosSinStock: 0,
  almacenesBloqueados: 0,
  valorInventario: null,
  ultimaActualizacion: '—',
}

function parseTab(value: string | null): InventoryTabId {
  if (value && VALID_TABS.includes(value as InventoryTabId)) return value as InventoryTabId
  return 'general'
}

function parseFiltro(value: string | null): MovimientoFiltroId {
  if (value && VALID_FILTROS.includes(value as MovimientoFiltroId)) return value as MovimientoFiltroId
  return 'all'
}

function isLegacyTab(value: string | null): value is InventoryLegacyTabId {
  return Boolean(value && value in LEGACY_TAB_TO_FILTRO)
}

function mapApiMovimientoToVista(
  item: Awaited<ReturnType<typeof movimientosApi.listar>>[number],
): MovimientoVista {
  return {
    id: item.id,
    fecha: item.fecha,
    tipo: (item.tipo as MovimientoVista['tipo']) || 'entrada',
    productoId: item.productoId,
    productoTitulo: item.productoTitulo ?? item.productoId,
    almacenId: item.almacenId,
    almacenNombre: item.almacenNombre ?? item.almacenId,
    cantidad: item.cantidad,
    saldoAnterior: item.saldoAnterior,
    saldoPosterior: item.saldoPosterior,
    documentoTipo: (item.documentoTipo as MovimientoVista['documentoTipo']) || 'ajuste',
    documentoId: item.documentoId,
    usuario: item.usuario,
    sucursal:
      item.sucursal ??
      item.almacenNombre ??
      item.almacenId,
  }
}

function mapApiKardexToVista(
  item: Awaited<ReturnType<typeof kardexApi.listar>>[number],
): KardexLineaVista {
  return {
    id: item.id,
    fecha: item.fecha,
    productoId: item.productoId,
    productoTitulo: item.productoTitulo ?? item.productoId,
    isbn: item.isbn ?? '',
    tipo: (item.tipo as KardexLineaVista['tipo']) || 'entrada',
    cantidad: item.cantidad,
    saldo: item.saldo,
    documentoTipo: item.documentoTipo,
    documentoId: item.documentoId,
    usuario: item.usuario,
    almacen: item.almacen ?? '',
  }
}

function mapApiAuditoriaToVista(
  item: Awaited<ReturnType<typeof auditoriaInventarioApi.listar>>[number],
): AuditoriaInventarioVista {
  return {
    id: item.id,
    fecha: item.fecha,
    usuario: item.usuario,
    accion: item.accion,
    documentoTipo: item.documentoTipo,
    documentoId: item.documentoId,
    ip: item.ip ?? '—',
    resultado: item.resultado,
    detalle: item.detalle,
  }
}

function mapTransferenciaToVista(
  item: Awaited<
    ReturnType<
      typeof transferenciasApi.listar
    >
  >[number],
): TransferenciaVista {
  return {
    id: item.id,
    codigo: item.codigo,
    origen:
      item.almacenOrigenNombre,
    destino:
      item.almacenDestinoNombre,
    estado: item.estado,
    fecha: item.fecha,
    productoResumen:
      item.productoResumen,
    cantidadTotal:
      item.cantidadTotal,
    solicitante:
      item.solicitanteNombre,
  }
}

export function Inventory() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<InventoryTabId>(() => {
    const raw = searchParams.get('tab')
    if (isLegacyTab(raw)) return 'movimientos'
    return parseTab(raw)
  })
  const [movimientoFiltro, setMovimientoFiltro] = useState<MovimientoFiltroId>(() => {
    const raw = searchParams.get('tab')
    if (isLegacyTab(raw)) return LEGACY_TAB_TO_FILTRO[raw]
    return parseFiltro(searchParams.get('filtro'))
  })
  const [kardexProductoId, setKardexProductoId] = useState<string | null>(null)
  const [productos, setProductos] =
    useState<ProductoInventarioVista[]>([])

  const [movimientos, setMovimientos] =
    useState<MovimientoVista[]>([])

  const [transferencias, setTransferencias] =
    useState<TransferenciaVista[]>([])

  const [kardexLineas, setKardexLineas] =
    useState<KardexLineaVista[]>([])

  const [auditoria, setAuditoria] =
    useState<AuditoriaInventarioVista[]>([])

  const [kpis, setKpis] =
    useState<InventoryDashboardKpis>(
      EMPTY_KPIS,
    )
  const loadDashboard = useCallback(async () => {
    try {
      const data =
        await inventarioQueryApi.dashboardKpis()

      setKpis(data)
    } catch (err) {
      console.error(
        'Error cargando dashboard de inventario:',
        err,
      )

      setKpis(EMPTY_KPIS)
    }
  }, [])

  const loadProductos = useCallback(async () => {
    try {
      const data =
        await inventarioQueryApi.productosVista()

      setProductos(data)
    } catch (err) {
      console.error(
        'Error cargando productos de inventario:',
        err,
      )

      setProductos([])
    }
  }, [])

  const loadMovimientos = useCallback(async () => {
    try {
      const data = await movimientosApi.listar()

      setMovimientos(
        data.map(mapApiMovimientoToVista),
      )
    } catch (err) {
      console.error(
        'Error cargando movimientos:',
        err,
      )

      setMovimientos([])
    }
  }, [])

    const loadTransferencias = useCallback(async () => {
    try {
      const data = await transferenciasApi.listar()

      setTransferencias(
        data.map(mapTransferenciaToVista),
      )
    } catch (err) {
      console.error(
        'Error cargando transferencias:',
        err,
      )

      setTransferencias([])
    }
  }, [])

  const loadKardex = useCallback(async () => {
    try {
      const data = await kardexApi.listar(
        kardexProductoId ?? undefined,
      )

      setKardexLineas(
        data.map(mapApiKardexToVista),
      )
    } catch (err) {
      console.error(
        'Error cargando Kardex:',
        err,
      )

      setKardexLineas([])
    }
  }, [kardexProductoId])

  const loadAuditoria = useCallback(async () => {
    try {
      const data =
        await auditoriaInventarioApi.listar()

      setAuditoria(
        data.map(mapApiAuditoriaToVista),
      )
    } catch (err) {
      console.error(
        'Error cargando auditoría:',
        err,
      )

      setAuditoria([])
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (activeTab === 'general') {
      void loadProductos()
      return
    }

    if (activeTab === 'movimientos') {
      void loadMovimientos()
      return
    }

    if (activeTab === 'transferencias') {
      void loadTransferencias()
      return
    }

    if (activeTab === 'kardex') {
      void loadKardex()
      return
    }

    if (activeTab === 'auditoria') {
      void loadAuditoria()
    }
  }, [
    activeTab,
    loadProductos,
    loadMovimientos,
    loadTransferencias,
    loadKardex,
    loadAuditoria,
  ])

  useEffect(() => {
    const rawTab = searchParams.get('tab')
    if (isLegacyTab(rawTab)) {
      const next = new URLSearchParams(searchParams)
      next.set('tab', 'movimientos')
      next.set('filtro', LEGACY_TAB_TO_FILTRO[rawTab])
      setSearchParams(next, { replace: true })
      return
    }
    setActiveTab(parseTab(rawTab))
    setMovimientoFiltro(parseFiltro(searchParams.get('filtro')))
  }, [searchParams, setSearchParams])

  const changeTab = useCallback(
    (tab: InventoryTabId) => {
      setActiveTab(tab)
      const next = new URLSearchParams(searchParams)
      if (tab === 'general') {
        next.delete('tab')
        next.delete('filtro')
      } else {
        next.set('tab', tab)
        if (tab !== 'movimientos') next.delete('filtro')
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const changeMovimientoFiltro = useCallback(
    (filtro: MovimientoFiltroId) => {
      setMovimientoFiltro(filtro)
      const next = new URLSearchParams(searchParams)
      next.set('tab', 'movimientos')
      if (filtro === 'all') next.delete('filtro')
      else next.set('filtro', filtro)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const openKardex = useCallback(
    (productoId: string) => {
      setKardexProductoId(productoId)
      changeTab('kardex')
    },
    [changeTab]
  )

  const openDocumento = useCallback(
    (tipo: string, id: string) => {
      const t = tipo.toLowerCase()
      if (t.includes('transfer')) {
        navigate(`/inventario/transferencias/${id}`)
        return
      }
      if (t.includes('descarte')) {
        navigate(`/inventario/descartes/${id}`)
        return
      }
      if (t.includes('ajuste')) {
        navigate(`/inventario/ajustes/${id}`)
        return
      }
      if (t.includes('conteo')) {
        navigate(`/inventario/conteos/${id}`)
        return
      }
      navigate(`/inventario/movimientos/${id}`)
    },
    [navigate]
  )

  const movimientoContext = activeTab === 'movimientos' ? MOVIMIENTO_CONTEXT[movimientoFiltro] : null

  const tabActions = (() => {
    if (activeTab === 'general') {
      return (
        <>
          <Button icon={Plus} onClick={() => navigate('/inventario/nuevo')}>
            Registrar existencia
          </Button>
          <Button variant="outline" onClick={() => navigate('/inventario/productos')}>
            Catálogo de productos
          </Button>
          <Button variant="outline" icon={Calculator} onClick={() => navigate('/inventario/costeo/nuevo')}>
            Costeo
          </Button>
        </>
      )
    }
    if (activeTab === 'transferencias') {
      return (
        <Button
          icon={Plus}
          onClick={() =>
            navigate(
              '/inventario/transferencias/nuevo',
            )
          }
        >
          Nueva transferencia
        </Button>
      )
    }
    if (movimientoContext?.buttonLabel && movimientoContext.buttonPath) {
      return (
        <Button icon={Plus} onClick={() => navigate(movimientoContext.buttonPath!)}>
          {movimientoContext.buttonLabel}
        </Button>
      )
    }
    return null
  })()

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-corporate">Gestión de Inventario</h1>
        {tabActions && <div className="flex flex-wrap gap-2">{tabActions}</div>}
      </div>

      <InventoryDashboard kpis={kpis} />

      <InventoryTabNav active={activeTab} onChange={changeTab} />

      {activeTab === 'general' && <GeneralTab productos={productos} onOpenKardex={openKardex} />}
      {activeTab === 'movimientos' && (
        <MovimientosTab
          movimientos={movimientos}
          filtro={movimientoFiltro}
          onFiltroChange={changeMovimientoFiltro}
          onOpenKardex={openKardex}
          onOpenDocumento={openDocumento}
          highlightId={null}
        />
      )}
      {activeTab === 'transferencias' && (
        <TransferenciasTab
          transferencias={transferencias}
        />
      )}
      {activeTab === 'kardex' && (
        <KardexTab
          lineas={kardexLineas}
          filterProductoId={kardexProductoId}
          onOpenDocumento={openDocumento}
          onClearProductoFilter={() => setKardexProductoId(null)}
        />
      )}
      {activeTab === 'auditoria' && <AuditoriaTab registros={auditoria} onOpenDocumento={openDocumento} />}
    </div>
  )
}
