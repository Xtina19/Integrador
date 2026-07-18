import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Calculator, ArrowLeftRight, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InventoryDashboard } from '../components/InventoryDashboard'
import { InventoryTabNav } from '../components/InventoryTabNav'
import {
  ajustesVista as ajustesVistaMock,
  auditoriaInventarioVista as auditoriaInventarioVistaMock,
  inventoryDashboardKpis as inventoryDashboardKpisMock,
  kardexVista as kardexVistaMock,
  movimientosVista as movimientosVistaMock,
  productosInventarioVista as productosInventarioVistaMock,
  transferenciasVista as transferenciasVistaMock,
} from '../data/inventoryDomainMock'
import type {
  AjusteVista,
  AuditoriaInventarioVista,
  ConteoVista,
  DescarteMotivoUi,
  DescarteVista,
  InventoryTabId,
  KardexLineaVista,
  MovimientoVista,
  ProductoInventarioVista,
  TransferenciaVista,
} from '../types/inventoryUi'
import { GeneralTab } from '../tabs/GeneralTab'
import { MovimientosTab } from '../tabs/MovimientosTab'
import { TransferenciasTab } from '../tabs/TransferenciasTab'
import { ConteosTab } from '../tabs/ConteosTab'
import { AjustesTab } from '../tabs/AjustesTab'
import { DescartesTab } from '../tabs/DescartesTab'
import { KardexTab } from '../tabs/KardexTab'
import { AuditoriaTab } from '../tabs/AuditoriaTab'
import { conteosApi } from '@/services/api/conteosApi'
import { descartesApi } from '@/services/api/descartesApi'
import { movimientosApi } from '@/services/api/movimientosApi'
import { transferenciasApi } from '@/services/api/transferenciasApi'
import { ajustesApi } from '@/services/api/ajustesApi'
import { kardexApi } from '@/services/api/kardexApi'
import { auditoriaInventarioApi } from '@/services/api/auditoriaInventarioApi'
import { inventarioQueryApi } from '@/services/api/inventarioQueryApi'
import { branches } from '@/mocks/mockCore'

const VALID_TABS: InventoryTabId[] = [
  'general',
  'movimientos',
  'transferencias',
  'conteos',
  'ajustes',
  'descartes',
  'kardex',
  'auditoria',
]

function parseTab(value: string | null): InventoryTabId {
  if (value && VALID_TABS.includes(value as InventoryTabId)) return value as InventoryTabId
  return 'general'
}

function almacenNombre(id: string): string {
  return branches.find((b) => b.id === id)?.name ?? id
}

function mapApiConteoToVista(
  item: Awaited<ReturnType<typeof conteosApi.listar>>[number],
): ConteoVista {
  return {
    id: item.id,
    codigo: item.codigo,
    almacen: almacenNombre(item.almacenId),
    tipo: (item.tipoConteo as ConteoVista['tipo']) || 'parcial',
    estado: (item.estado as ConteoVista['estado']) || 'borrador',
    faseVisible: item.fase || 'Crear',
    productosAlcance: item.productosAlcance,
    diferencias: item.diferencias,
    responsable: item.responsableNombre ?? item.responsableId,
    fecha: item.fecha,
    bloqueoActivo: item.bloqueoActivo,
  }
}

const DESCARTE_MOTIVO_MAP: Record<string, DescarteMotivoUi> = {
  DANO_FISICO: 'dano',
  DONACION: 'donacion',
  PERDIDA: 'perdida',
  ROBO: 'robo',
  ERROR_RECEPCION: 'error_recepcion',
  PRODUCTO_DEFECTUOSO: 'otro',
  CADUCIDAD: 'otro',
  OTRO: 'otro',
}

function mapApiDescarteToVista(
  item: Awaited<ReturnType<typeof descartesApi.listar>>[number],
): DescarteVista {
  return {
    id: item.id,
    codigo: item.codigo,
    almacen: almacenNombre(item.almacenId),
    estado: (item.estado as DescarteVista['estado']) || 'borrador',
    motivo: DESCARTE_MOTIVO_MAP[item.motivoCodigo] ?? 'otro',
    cantidad: item.cantidadTotal,
    producto: item.productosResumen || '—',
    solicitante: item.responsableNombre ?? '—',
    evidencia: item.evidenciaCount > 0,
    fecha: item.fecha,
  }
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
    almacenNombre: item.almacenNombre ?? almacenNombre(item.almacenId),
    cantidad: item.cantidad,
    saldoAnterior: item.saldoAnterior,
    saldoPosterior: item.saldoPosterior,
    documentoTipo: (item.documentoTipo as MovimientoVista['documentoTipo']) || 'ajuste',
    documentoId: item.documentoId,
    usuario: item.usuario,
    sucursal: item.sucursal ?? item.almacenNombre ?? almacenNombre(item.almacenId),
  }
}

function mapApiTransferenciaToVista(
  item: Awaited<ReturnType<typeof transferenciasApi.listar>>[number],
): TransferenciaVista {
  return {
    id: item.id,
    codigo: item.codigo,
    origen: almacenNombre(item.almacenOrigenId),
    destino: almacenNombre(item.almacenDestinoId),
    estado: item.estado,
    fecha: item.fecha,
    productoResumen: item.productoResumen,
    cantidadTotal: item.cantidadTotal,
    solicitante: item.solicitanteId,
  }
}

function mapApiAjusteToVista(
  item: Awaited<ReturnType<typeof ajustesApi.listar>>[number],
): AjusteVista {
  return {
    id: item.id,
    codigo: item.codigo,
    almacen: almacenNombre(item.almacenId),
    tipo: item.tipoAjuste,
    estado: item.estado,
    producto: item.productoResumen,
    diferencia: item.diferenciaTotal,
    objetivo: item.diferenciaTotal,
    solicitante: item.solicitanteId,
    fecha: item.fecha,
    historial: [],
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

export function Inventory() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<InventoryTabId>(() => parseTab(searchParams.get('tab')))
  const [kardexProductoId, setKardexProductoId] = useState<string | null>(null)
  const [productos, setProductos] = useState<ProductoInventarioVista[]>(productosInventarioVistaMock)
  const [movimientos, setMovimientos] = useState<MovimientoVista[]>(movimientosVistaMock)
  const [transferencias, setTransferencias] = useState<TransferenciaVista[]>(transferenciasVistaMock)
  const [conteos, setConteos] = useState<ConteoVista[]>([])
  const [ajustes, setAjustes] = useState<AjusteVista[]>(ajustesVistaMock)
  const [descartes, setDescartes] = useState<DescarteVista[]>([])
  const [kardexLineas, setKardexLineas] = useState<KardexLineaVista[]>(kardexVistaMock)
  const [auditoria, setAuditoria] = useState<AuditoriaInventarioVista[]>(auditoriaInventarioVistaMock)
  const [kpis, setKpis] = useState(inventoryDashboardKpisMock)

  const reloadAll = useCallback(async () => {
    const results = await Promise.allSettled([
      inventarioQueryApi.productosVista(),
      movimientosApi.listar(),
      transferenciasApi.listar(),
      conteosApi.listar(),
      ajustesApi.listar(),
      descartesApi.listar(),
      kardexApi.listar(),
      auditoriaInventarioApi.listar(),
      inventarioQueryApi.dashboardKpis(),
    ])

    const [
      productosRes,
      movimientosRes,
      transferenciasRes,
      conteosRes,
      ajustesRes,
      descartesRes,
      kardexRes,
      auditoriaRes,
      kpisRes,
    ] = results

    const nextProductos =
      productosRes.status === 'fulfilled' && productosRes.value.length > 0
        ? productosRes.value
        : productosInventarioVistaMock
    setProductos(nextProductos)

    setMovimientos(
      movimientosRes.status === 'fulfilled' && movimientosRes.value.length > 0
        ? movimientosRes.value.map(mapApiMovimientoToVista)
        : movimientosVistaMock,
    )
    setTransferencias(
      transferenciasRes.status === 'fulfilled' && transferenciasRes.value.length > 0
        ? transferenciasRes.value.map(mapApiTransferenciaToVista)
        : transferenciasVistaMock,
    )
    setConteos(conteosRes.status === 'fulfilled' ? conteosRes.value.map(mapApiConteoToVista) : [])
    setAjustes(
      ajustesRes.status === 'fulfilled' && ajustesRes.value.length > 0
        ? ajustesRes.value.map(mapApiAjusteToVista)
        : ajustesVistaMock,
    )
    setDescartes(descartesRes.status === 'fulfilled' ? descartesRes.value.map(mapApiDescarteToVista) : [])
    setKardexLineas(
      kardexRes.status === 'fulfilled' && kardexRes.value.length > 0
        ? kardexRes.value.map(mapApiKardexToVista)
        : kardexVistaMock,
    )
    setAuditoria(
      auditoriaRes.status === 'fulfilled' && auditoriaRes.value.length > 0
        ? auditoriaRes.value.map(mapApiAuditoriaToVista)
        : auditoriaInventarioVistaMock,
    )

    const baseKpis = kpisRes.status === 'fulfilled' ? kpisRes.value : inventoryDashboardKpisMock
    const productosBajoStock = nextProductos.filter((p) => p.estado === 'bajo').length
    const productosSinStock = nextProductos.filter(
      (p) => p.estado === 'agotado' || p.stockConsolidado <= 0,
    ).length
    const fechasMov = nextProductos
      .map((p) => p.ultimoMovimientoFecha)
      .filter((f): f is string => Boolean(f))
      .sort()
    const ultimaDesdeProductos = fechasMov.length > 0 ? fechasMov[fechasMov.length - 1] : undefined
    setKpis({
      ...baseKpis,
      stockTotal:
        baseKpis.stockTotal > 0
          ? baseKpis.stockTotal
          : nextProductos.reduce((acc, p) => acc + p.stockConsolidado, 0),
      productosBajoStock:
        baseKpis.productosBajoStock > 0 ? baseKpis.productosBajoStock : productosBajoStock,
      productosSinStock:
        baseKpis.productosSinStock > 0 ? baseKpis.productosSinStock : productosSinStock,
      ultimaActualizacion: ultimaDesdeProductos
        ? ultimaDesdeProductos.replace(' ', ', ')
        : baseKpis.ultimaActualizacion,
    })
  }, [])

  useEffect(() => {
    void reloadAll()
  }, [reloadAll, activeTab])

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get('tab')))
  }, [searchParams])

  const changeTab = useCallback(
    (tab: InventoryTabId) => {
      setActiveTab(tab)
      const next = new URLSearchParams(searchParams)
      if (tab === 'general') next.delete('tab')
      else next.set('tab', tab)
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

  const tabActions = (() => {
    switch (activeTab) {
      case 'general':
        return (
          <>
            <Button icon={Plus} onClick={() => navigate('/inventario/nuevo')}>
              Nuevo producto
            </Button>
            <Button variant="outline" icon={Calculator} onClick={() => navigate('/inventario/costeo/nuevo')}>
              Costeo
            </Button>
          </>
        )
      case 'transferencias':
        return (
          <Button icon={ArrowLeftRight} onClick={() => navigate('/inventario/transferencias/nuevo')}>
            Nueva transferencia
          </Button>
        )
      case 'conteos':
        return (
          <Button icon={ClipboardList} onClick={() => navigate('/inventario/conteos/nuevo')}>
            Crear conteo
          </Button>
        )
      case 'ajustes':
        return (
          <Button icon={Plus} onClick={() => navigate('/inventario/ajustes/nuevo')}>
            Nuevo ajuste
          </Button>
        )
      case 'descartes':
        return (
          <Button icon={Plus} onClick={() => navigate('/inventario/descartes/nuevo')}>
            Nuevo descarte
          </Button>
        )
      default:
        return null
    }
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
          onOpenKardex={openKardex}
          onOpenDocumento={openDocumento}
          highlightId={null}
        />
      )}
      {activeTab === 'transferencias' && <TransferenciasTab transferencias={transferencias} />}
      {activeTab === 'conteos' && <ConteosTab conteos={conteos} />}
      {activeTab === 'ajustes' && <AjustesTab ajustes={ajustes} />}
      {activeTab === 'descartes' && <DescartesTab descartes={descartes} />}
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
