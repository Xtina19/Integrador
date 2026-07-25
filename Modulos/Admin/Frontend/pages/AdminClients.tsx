import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { adminPath } from '@/lib/adminConfig'
import { useClientesCatalog } from '@/context/ClientesCatalogContext'
import {
  CLIENTE_ESTADO_OPTIONS,
  CLIENTE_TIPO_OPTIONS,
  labelClienteEstado,
  labelClienteTipo,
} from '@/modules/admin/clientesUi'
import type { ClienteEstado, ClienteTipo } from '@/types/clientes'

function estadoBadge(estado: ClienteEstado) {
  if (estado === 'activo') return <Badge variant="success">{labelClienteEstado(estado)}</Badge>
  if (estado === 'bloqueado') return <Badge variant="danger">{labelClienteEstado(estado)}</Badge>
  return <Badge variant="neutral">{labelClienteEstado(estado)}</Badge>
}

export function AdminClients() {
  const navigate = useNavigate()
  const { clientes, loading } = useClientesCatalog()
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<ClienteTipo | ''>('')
  const [estado, setEstado] = useState<ClienteEstado | ''>('')

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase()
    return clientes.filter((c) => {
      if (tipo && c.tipo !== tipo) return false
      if (estado && c.estado !== estado) return false
      if (!text) return true
      return (
        c.nombre.toLowerCase().includes(text) ||
        c.codigo.toLowerCase().includes(text) ||
        c.documento.toLowerCase().includes(text) ||
        c.telefono.toLowerCase().includes(text)
      )
    })
  }, [clientes, q, tipo, estado])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">
            Administración
          </Link>
          <span>/</span>
          <span>Clientes</span>
          <span className="ml-2">— {loading ? '…' : `${filtered.length} registros`}</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('clientes', 'nuevo'))}>
          Registrar Cliente
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Clientes" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              icon={Search}
              placeholder="Buscar por nombre, código o documento…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="md:col-span-2"
            />
            <Select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ClienteTipo | '')}
              options={[{ value: '', label: 'Todos los tipos' }, ...CLIENTE_TIPO_OPTIONS]}
            />
            <Select
              value={estado}
              onChange={(e) => setEstado(e.target.value as ClienteEstado | '')}
              options={[{ value: '', label: 'Todos los estados' }, ...CLIENTE_ESTADO_OPTIONS]}
            />
          </div>
        </CardBody>
        <CardBody className="!p-0 !pt-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'codigo',
                header: 'Código',
                render: (c) => <span className="font-mono text-xs text-corporate">{c.codigo}</span>,
              },
              {
                key: 'nombre',
                header: 'Nombre',
                render: (c) => <span className="font-medium text-gray-900">{c.nombre}</span>,
              },
              {
                key: 'tipo',
                header: 'Tipo',
                render: (c) => <Badge variant="neutral">{labelClienteTipo(c.tipo)}</Badge>,
              },
              {
                key: 'documento',
                header: 'Documento',
                render: (c) => (
                  <span className="text-sm text-gray-600">{c.documento || 'Sin documento'}</span>
                ),
              },
              {
                key: 'telefono',
                header: 'Teléfono',
                render: (c) => <span className="text-sm">{c.telefono || '—'}</span>,
              },
              {
                key: 'estado',
                header: 'Estado',
                render: (c) => estadoBadge(c.estado),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <TableActions
                    onView={() => navigate(adminPath('clientes', 'ver', c.id))}
                    onEdit={() => navigate(adminPath('clientes', 'editar', c.id))}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
