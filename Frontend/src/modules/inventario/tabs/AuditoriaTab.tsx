import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Input, Select } from '@/components/ui/Input'
import type { AuditoriaInventarioVista } from '../types/inventoryUi'
import { auditoriaInventarioApi } from '@/services/api/auditoriaInventarioApi'
import { useToast } from '@/context/ToastContext'
import { getFriendlyErrorMessage } from '@/services/http'

interface Props {
  registros: AuditoriaInventarioVista[]
  onOpenDocumento: (tipo: string, id: string) => void
}

export function AuditoriaTab({ registros, onOpenDocumento }: Props) {
  const { showSuccess, showError } = useToast()
  const [usuario, setUsuario] = useState('')
  const [documento, setDocumento] = useState('')
  const [accion, setAccion] = useState('')
  const [ip, setIp] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [resultado, setResultado] = useState('all')
  const [exporting, setExporting] = useState(false)

  const filtered = useMemo(() => {
    return registros.filter((r) => {
      const matchUsuario = !usuario || r.usuario.toLowerCase().includes(usuario.toLowerCase())
      const matchDocumento =
        !documento ||
        r.documentoId.toLowerCase().includes(documento.toLowerCase()) ||
        r.documentoTipo.toLowerCase().includes(documento.toLowerCase())
      const matchAccion = !accion || r.accion.toLowerCase().includes(accion.toLowerCase())
      const matchIp = !ip || r.ip.includes(ip)
      const matchResultado = resultado === 'all' || r.resultado === resultado
      const fechaSolo = r.fecha.slice(0, 10)
      const matchDesde = !desde || fechaSolo >= desde
      const matchHasta = !hasta || fechaSolo <= hasta
      return matchUsuario && matchDocumento && matchAccion && matchIp && matchResultado && matchDesde && matchHasta
    })
  }, [registros, usuario, documento, accion, ip, resultado, desde, hasta])

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await auditoriaInventarioApi.exportar({
        usuario: usuario || undefined,
        documentoId: documento || undefined,
        accion: accion || undefined,
        ip: ip || undefined,
        resultado: resultado !== 'all' ? resultado : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria-inventario-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showSuccess('Exportación de auditoría descargada')
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Auditoría"
        action={
          <Button icon={Download} size="sm" variant="outline" onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? 'Exportando…' : 'Exportar'}
          </Button>
        }
      />
      <CardBody className="!p-0">
        <div className="grid grid-cols-1 gap-3 p-4 pb-0 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Input label="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="correo…" />
          <Input
            label="Documento"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="TRF / AJ / DSC…"
          />
          <Input label="Acción" value={accion} onChange={(e) => setAccion(e.target.value)} placeholder="APLICAR…" />
          <Input label="IP" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.0.0.1" />
          <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <Select
            label="Resultado"
            value={resultado}
            onChange={(e) => setResultado(e.target.value)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'OK', label: 'OK' },
              { value: 'RECHAZADO', label: 'Rechazado' },
              { value: 'ERROR', label: 'Error' },
            ]}
          />
        </div>
        <Table
          keyField="id"
          data={filtered}
          columns={[
            { key: 'fecha', header: 'Fecha', className: 'whitespace-nowrap text-xs text-slate-500' },
            {
              key: 'usuario',
              header: 'Usuario',
              render: (r) => <span className="text-xs font-medium text-slate-700">{r.usuario}</span>,
            },
            {
              key: 'accion',
              header: 'Acción',
              render: (r) => <span className="font-mono text-[11px] text-corporate">{r.accion}</span>,
            },
            {
              key: 'documentoId',
              header: 'Documento',
              render: (r) => (
                <button
                  type="button"
                  className="text-left text-xs font-semibold text-corporate hover:underline"
                  onClick={() => onOpenDocumento(r.documentoTipo, r.documentoId)}
                >
                  {r.documentoId}
                  <span className="block font-normal capitalize text-slate-400">{r.documentoTipo}</span>
                </button>
              ),
            },
            {
              key: 'ip',
              header: 'IP',
              render: (r) => <span className="font-mono text-[11px] text-slate-500">{r.ip}</span>,
            },
            {
              key: 'resultado',
              header: 'Resultado',
              render: (r) => (
                <Badge
                  variant={
                    r.resultado === 'OK' ? 'success' : r.resultado === 'RECHAZADO' ? 'warning' : 'danger'
                  }
                >
                  {r.resultado}
                </Badge>
              ),
            },
            {
              key: 'detalle',
              header: 'Detalle',
              render: (r) => (
                <span className="max-w-[220px] text-xs text-slate-500">{r.detalle ?? '—'}</span>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  )
}
