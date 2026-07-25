import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { AdminBreadcrumb } from '@/modules/admin/components/AdminBreadcrumb'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { ADMIN_MODULES, adminPath } from '@/lib/adminConfig'
import { useClientesCatalog } from '@/context/ClientesCatalogContext'
import {
  documentoTipoSugerido,
  validateCliente,
} from '@/business-rules/clienteValidators'
import {
  CLIENTE_DOCUMENTO_OPTIONS,
  CLIENTE_ESTADO_OPTIONS,
  CLIENTE_SUCURSAL_OPTIONS,
  CLIENTE_TIPO_OPTIONS,
  formatDop,
  labelClienteDocumento,
  labelClienteEstado,
  labelClienteTipo,
  labelSucursalPreferida,
} from '@/modules/admin/clientesUi'
import type {
  ClienteCompraResumen,
  ClienteFacturaResumen,
  ClienteInput,
  ClienteNotaCreditoResumen,
  ClienteTipo,
} from '@/types/clientes'
import { ventasApi, type VentaDetalleDto } from '@/services/api/ventasApi'
import { refLabel } from '@/modules/ventas/utils/ventasUi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.clientes

const emptyInput = (): ClienteInput => ({
  nombre: '',
  tipo: 'persona',
  documentoTipo: 'cedula',
  documento: '',
  telefono: '',
  correo: '',
  institucion: '',
  sucursalPreferidaId: '',
  estado: 'activo',
  observaciones: '',
})

function estadoBadge(estado: ClienteInput['estado']) {
  if (estado === 'activo') return <Badge variant="success">{labelClienteEstado(estado)}</Badge>
  if (estado === 'bloqueado') return <Badge variant="danger">{labelClienteEstado(estado)}</Badge>
  return <Badge variant="neutral">{labelClienteEstado(estado)}</Badge>
}

function ClienteFields({
  form,
  setForm,
  codigoPreview,
  compact,
}: {
  form: ClienteInput
  setForm: React.Dispatch<React.SetStateAction<ClienteInput>>
  codigoPreview?: string
  compact?: boolean
}) {
  const update = <K extends keyof ClienteInput>(key: K, value: ClienteInput[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'tipo') {
        const tipo = value as ClienteTipo
        next.documentoTipo = documentoTipoSugerido(tipo)
      }
      return next
    })
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${compact ? 'gap-4' : ''}`}>
      {codigoPreview !== undefined && (
        <Input label="Código interno" value={codigoPreview} disabled className="md:col-span-2" />
      )}
      <Input
        label="Nombre / razón social *"
        value={form.nombre}
        onChange={(e) => update('nombre', e.target.value)}
        className="md:col-span-2"
      />
      <Select
        label="Tipo de cliente *"
        value={form.tipo}
        onChange={(e) => update('tipo', e.target.value as ClienteTipo)}
        options={CLIENTE_TIPO_OPTIONS}
      />
      {!compact && (
        <Select
          label="Estado *"
          value={form.estado}
          onChange={(e) => update('estado', e.target.value as ClienteInput['estado'])}
          options={CLIENTE_ESTADO_OPTIONS}
        />
      )}
      <Select
        label="Tipo de documento"
        value={form.documentoTipo}
        onChange={(e) => update('documentoTipo', e.target.value as ClienteInput['documentoTipo'])}
        options={CLIENTE_DOCUMENTO_OPTIONS}
      />
      <Input
        label={form.tipo === 'persona' ? 'Documento' : 'Documento *'}
        value={form.documento}
        onChange={(e) => update('documento', e.target.value)}
        placeholder={form.tipo === 'persona' ? 'Opcional en alta inicial' : 'RNC'}
        disabled={form.documentoTipo === 'ninguno'}
      />
      <Input
        label={compact ? 'Teléfono *' : 'Teléfono'}
        value={form.telefono}
        onChange={(e) => update('telefono', e.target.value)}
      />
      <Input
        label="Correo"
        type="email"
        value={form.correo}
        onChange={(e) => update('correo', e.target.value)}
      />
      {(form.tipo === 'colegio' || form.tipo === 'universidad' || form.tipo === 'institucion') && (
        <Input
          label="Institución / dependencia *"
          value={form.institucion}
          onChange={(e) => update('institucion', e.target.value)}
          className="md:col-span-2"
        />
      )}
      {!compact && (
        <Select
          label="Sucursal preferida"
          value={form.sucursalPreferidaId}
          onChange={(e) => update('sucursalPreferidaId', e.target.value)}
          options={CLIENTE_SUCURSAL_OPTIONS}
        />
      )}
      <Textarea
        label="Observaciones"
        value={form.observaciones}
        onChange={(e) => update('observaciones', e.target.value)}
        className="md:col-span-2"
        rows={compact ? 2 : 3}
        placeholder="Notas operativas de mostrador (máx. 200)"
      />
    </div>
  )
}

export function ClientFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showError } = useToast()
  const { clientes, getById, createCliente, updateCliente } = useClientesCatalog()
  const existing = isEdit ? getById(id!) : undefined

  const [form, setForm] = useState<ClienteInput>(() =>
    existing
      ? {
          nombre: existing.nombre,
          tipo: existing.tipo,
          documentoTipo: existing.documentoTipo,
          documento: existing.documento,
          telefono: existing.telefono,
          correo: existing.correo,
          institucion: existing.institucion,
          sucursalPreferidaId: existing.sucursalPreferidaId,
          estado: existing.estado,
          observaciones: existing.observaciones,
        }
      : emptyInput(),
  )

  const validation = useMemo(
    () =>
      validateCliente(form, {
        modo: 'completo',
        documentosExistentes: clientes
          .filter((c) => c.id !== existing?.id)
          .map((c) => c.documento)
          .filter(Boolean),
      }),
    [form, clientes, existing?.id],
  )

  if (isEdit && !existing) {
    return <RecordNotFound moduleLabel="cliente" listPath={config.basePath} />
  }

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        if (isEdit && existing) {
          await updateCliente(existing.id, form)
        } else {
          await createCliente(form)
        }
        navigate(config.basePath)
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  return (
    <AdminFormLayout
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: isEdit ? config.editTitle : config.createTitle },
      ]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.codigo}` : 'Código generado automáticamente por el sistema'}
      listPath={config.basePath}
      saveDisabled={!validation.valid}
      onSave={saveForm}
      onSaveContinue={
        !isEdit
          ? () => {
              if (!validation.valid) return false
              void (async () => {
                try {
                  await createCliente(form)
                  setForm(emptyInput())
                } catch (err) {
                  showError(getFriendlyErrorMessage(err))
                }
              })()
              return false
            }
          : undefined
      }
    >
      {!validation.valid && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <ClienteFields
        form={form}
        setForm={setForm}
        codigoPreview={isEdit ? existing!.codigo : 'Se asignará al guardar (CLI-######)'}
      />
    </AdminFormLayout>
  )
}

export function ClientExpedientePage() {
  const { id } = useParams()
  const { getById } = useClientesCatalog()
  const cliente = getById(id!)

  const [loadingVentas, setLoadingVentas] = useState(true)
  const [ventasError, setVentasError] = useState<string | null>(null)
  const [facturas, setFacturas] = useState<ClienteFacturaResumen[]>([])
  const [notas, setNotas] = useState<ClienteNotaCreditoResumen[]>([])
  const [resumen, setResumen] = useState<ClienteCompraResumen>({
    facturasCount: 0,
    notasCreditoCount: 0,
    totalComprado: 0,
    totalNc: 0,
    ultimaCompra: null,
    sucursalFrecuente: null,
  })

  useEffect(() => {
    if (!cliente || !ventasApi.isEnabled()) {
      setLoadingVentas(false)
      if (cliente && !ventasApi.isEnabled()) {
        setVentasError('Active VITE_USE_API_VENTAS para consultar facturas y NC desde Ventas.')
      }
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingVentas(true)
      setVentasError(null)
      try {
        const list = await ventasApi.listar({ clienteId: cliente.id, limit: 200 })
        const detalles: VentaDetalleDto[] = []
        for (const r of list) {
          if (r.tieneNotasCredito) {
            detalles.push(await ventasApi.getById(r.id))
          }
        }
        if (cancelled) return

        const facturaRows: ClienteFacturaResumen[] = list.map((f) => ({
          id: f.id,
          numero: f.numeroFactura,
          fecha: f.fechaEmision.slice(0, 10),
          sucursal: refLabel(f.sucursalId),
          total: f.total,
          estado: f.estado,
        }))

        const ncRows: ClienteNotaCreditoResumen[] = []
        for (const d of detalles) {
          for (const n of d.notasCredito) {
            ncRows.push({
              id: n.id,
              numero: n.id.startsWith('NC-') ? n.id : `NC · ${n.id.slice(0, 8)}`,
              fecha: n.fecha.slice(0, 10),
              facturaOrigen: d.numeroFactura,
              facturaOrigenId: d.id,
              total: n.monto,
              estado: n.estado,
            })
          }
        }

        const totalComprado = facturaRows.reduce((s, f) => s + f.total, 0)
        const totalNc = ncRows.reduce((s, n) => s + n.total, 0)
        const sucursalCounts = new Map<string, number>()
        for (const f of facturaRows) {
          sucursalCounts.set(f.sucursal, (sucursalCounts.get(f.sucursal) ?? 0) + 1)
        }
        let sucursalFrecuente: string | null = null
        let max = 0
        for (const [suc, n] of sucursalCounts) {
          if (n > max) {
            max = n
            sucursalFrecuente = suc
          }
        }

        setFacturas(facturaRows)
        setNotas(ncRows)
        setResumen({
          facturasCount: facturaRows.length,
          notasCreditoCount: ncRows.length,
          totalComprado,
          totalNc,
          ultimaCompra: facturaRows[0]?.fecha ?? null,
          sucursalFrecuente,
        })
      } catch (e) {
        if (!cancelled) setVentasError(getFriendlyErrorMessage(e))
      } finally {
        if (!cancelled) setLoadingVentas(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cliente])

  if (!cliente) return <RecordNotFound moduleLabel="cliente" listPath={config.basePath} />

  return (
    <AdminDetailLayout
      config={config}
      id={cliente.id}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: 'Expediente del Cliente' },
      ]}
      title={cliente.nombre}
      subtitle={`${cliente.codigo} · ${labelClienteTipo(cliente.tipo)}`}
      statusBadge={estadoBadge(cliente.estado)}
      showDelete={false}
      editPath={adminPath('clientes', 'editar', cliente.id)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DetailSection title="Datos generales">
            <dl>
              <DetailRow label="Código" value={<span className="font-mono text-corporate">{cliente.codigo}</span>} />
              <DetailRow label="Tipo" value={labelClienteTipo(cliente.tipo)} />
              <DetailRow
                label="Documento"
                value={
                  cliente.documento
                    ? `${labelClienteDocumento(cliente.documentoTipo)}: ${cliente.documento}`
                    : 'Sin documento'
                }
              />
              <DetailRow label="Teléfono" value={cliente.telefono || '—'} />
              <DetailRow label="Correo" value={cliente.correo || '—'} />
              <DetailRow label="Institución" value={cliente.institucion || '—'} />
              <DetailRow label="Sucursal preferida" value={labelSucursalPreferida(cliente.sucursalPreferidaId)} />
              <DetailRow label="Estado" value={estadoBadge(cliente.estado)} />
              <DetailRow label="Fecha de alta" value={cliente.fechaAlta} />
              <DetailRow label="Alta por" value={cliente.creadoPor} />
              <DetailRow label="Última modificación" value={`${cliente.actualizadoEn} · ${cliente.actualizadoPor}`} />
            </dl>
          </DetailSection>

          <DetailSection title="Resumen de compras" subtitle="Consulta desde Ventas">
            {loadingVentas ? (
              <p className="text-sm text-gray-500 py-4">Cargando desde Ventas…</p>
            ) : ventasError ? (
              <p className="text-sm text-amber-800 py-2">{ventasError}</p>
            ) : (
              <dl>
                <DetailRow label="Facturas" value={<span className="font-semibold text-corporate">{resumen.facturasCount}</span>} />
                <DetailRow label="Notas de crédito" value={String(resumen.notasCreditoCount)} />
                <DetailRow label="Total comprado" value={<span className="font-semibold">{formatDop(resumen.totalComprado)}</span>} />
                <DetailRow label="Total NC" value={formatDop(resumen.totalNc)} />
                <DetailRow label="Última compra" value={resumen.ultimaCompra ?? '—'} />
                <DetailRow label="Sucursal frecuente" value={resumen.sucursalFrecuente ?? '—'} />
              </dl>
            )}
          </DetailSection>
        </div>

        <DetailSection title="Facturas" subtitle="Solo consulta — abrir expediente en Ventas">
          {loadingVentas ? (
            <p className="text-sm text-gray-500 py-4">Cargando facturas…</p>
          ) : facturas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Sin facturas registradas para este cliente.</p>
          ) : (
            <Table
              keyField="id"
              data={facturas}
              columns={[
                {
                  key: 'numero',
                  header: 'Factura',
                  render: (f) => (
                    <Link to={`/ventas/facturas/${f.id}`} className="font-mono text-xs text-corporate hover:underline">
                      {f.numero}
                    </Link>
                  ),
                },
                { key: 'fecha', header: 'Fecha', className: 'text-xs' },
                { key: 'sucursal', header: 'Sucursal' },
                {
                  key: 'total',
                  header: 'Total',
                  render: (f) => <span className="font-semibold">{formatDop(f.total)}</span>,
                },
                {
                  key: 'estado',
                  header: 'Estado',
                  render: (f) => <Badge variant={f.estado === 'anulada' ? 'danger' : 'success'}>{f.estado}</Badge>,
                },
              ]}
            />
          )}
        </DetailSection>

        <DetailSection title="Notas de crédito" subtitle="Consulta — emisión desde el expediente de la factura">
          {loadingVentas ? (
            <p className="text-sm text-gray-500 py-4">Cargando notas de crédito…</p>
          ) : notas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Sin notas de crédito asociadas.</p>
          ) : (
            <Table
              keyField="id"
              data={notas}
              columns={[
                {
                  key: 'numero',
                  header: 'NC',
                  render: (n) => <span className="font-mono text-xs text-corporate">{n.numero}</span>,
                },
                { key: 'fecha', header: 'Fecha', className: 'text-xs' },
                {
                  key: 'facturaOrigen',
                  header: 'Factura origen',
                  render: (n) => (
                    <Link
                      to={`/ventas/facturas/${n.facturaOrigenId}`}
                      className="font-mono text-xs text-corporate hover:underline"
                    >
                      {n.facturaOrigen}
                    </Link>
                  ),
                },
                {
                  key: 'total',
                  header: 'Total',
                  render: (n) => <span className="font-semibold">{formatDop(n.total)}</span>,
                },
                {
                  key: 'estado',
                  header: 'Estado',
                  render: (n) => <Badge variant="neutral">{n.estado}</Badge>,
                },
              ]}
            />
          )}
        </DetailSection>

        <DetailSection title="Observaciones">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {cliente.observaciones || 'Sin observaciones operativas.'}
          </p>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

/** Alta rápida desde POS — mismo maestro, retorno automático con cliente seleccionado. */
export function ClientAltaRapidaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clientes, createCliente } = useClientesCatalog()
  const returnTo = searchParams.get('returnTo') || '/ventas/pos'
  const [form, setForm] = useState<ClienteInput>(emptyInput)

  const validation = useMemo(
    () =>
      validateCliente(form, {
        modo: 'alta_rapida',
        documentosExistentes: clientes.map((c) => c.documento).filter(Boolean),
      }),
    [form, clientes],
  )

  const handleSave = async () => {
    if (!validation.valid) return
    try {
      const creado = await createCliente({ ...form, estado: 'activo' }, { creadoPor: 'POS / Alta rápida' })
      const sep = returnTo.includes('?') ? '&' : '?'
      navigate(`${returnTo}${sep}clienteId=${encodeURIComponent(creado.id)}`)
    } catch {
      // toast handled in context
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminBreadcrumb
          items={[
            { label: 'Administración', to: '/administracion' },
            { label: 'Clientes', to: config.basePath },
            { label: 'Alta rápida' },
          ]}
        />
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(returnTo)}>
          Volver al POS
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Alta rápida de cliente"
          subtitle="Se registra en el mismo maestro de Administración. Al guardar regresará al POS con el cliente seleccionado."
        />
        <CardBody>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <ClienteFields form={form} setForm={setForm} compact codigoPreview="Se asignará al guardar (CLI-######)" />
        </CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <Button variant="outline" onClick={() => navigate(returnTo)}>
          Cancelar
        </Button>
        <Button icon={Save} onClick={handleSave} disabled={!validation.valid}>
          Guardar y volver al POS
        </Button>
      </div>
    </div>
  )
}
