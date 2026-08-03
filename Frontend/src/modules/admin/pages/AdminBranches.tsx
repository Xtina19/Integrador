import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Input, Select } from '@/components/ui/Input'
import {
  almacenesApi,
  type AlmacenDto,
  type AlmacenEstado,
} from '@/services/api/almacenesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const ESTADO_LABEL: Record<AlmacenEstado, string> = {
  Activo: 'Activo',
  Inactivo: 'Inactivo',
}

export function AdminBranches() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<'Todos' | AlmacenEstado>('Todos')
  const [changingId, setChangingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const list = await almacenesApi.list()
      setAlmacenes(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      setAlmacenes([])
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return almacenes.filter((almacen) => {
      const matchSearch =
        !query ||
        almacen.codigo.toLowerCase().includes(query) ||
        almacen.nombre.toLowerCase().includes(query) ||
        almacen.sucursalNombre?.toLowerCase().includes(query) ||
        almacen.ciudad.toLowerCase().includes(query) ||
        almacen.responsable.toLowerCase().includes(query)

      const matchEstado =
        estado === 'Todos' || almacen.estado === estado

      return matchSearch && matchEstado
    })
  }, [almacenes, search, estado])

  async function toggleEstado(almacen: AlmacenDto) {
    const nuevoEstado: AlmacenEstado =
      almacen.estado === 'Activo'
        ? 'Inactivo'
        : 'Activo'

    setChangingId(almacen.id)

    try {
      await almacenesApi.setEstado(almacen.id, nuevoEstado)

      showSuccess(
        nuevoEstado === 'Activo'
          ? 'Almacén activado'
          : 'Almacén desactivado',
      )

      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setChangingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            to="/inventario"
            className="text-corporate hover:underline"
          >
            Inventario
          </Link>

          <span>/</span>
          <span>Almacenes</span>

          <span className="ml-2">
            — {loading ? '…' : `${almacenes.length} registros`}
          </span>
        </div>

        <Button
          icon={Plus}
          onClick={() =>
            navigate('/inventario/almacenes/nuevo')
          }
        >
          Registrar almacén
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Catálogo de almacenes"
          subtitle="Ubicaciones donde se administran las existencias"
        />

        <CardBody className="!p-0">
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-4 md:grid-cols-2">
            <Input
              label="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Código, nombre, sucursal o responsable..."
            />

            <Select
              label="Estado"
              value={estado}
              onChange={(event) =>
                setEstado(
                  event.target.value as
                    | 'Todos'
                    | AlmacenEstado,
                )
              }
              options={[
                { value: 'Todos', label: 'Todos' },
                { value: 'Activo', label: 'Activos' },
                { value: 'Inactivo', label: 'Inactivos' },
              ]}
            />
          </div>

          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'codigo',
                header: 'Código',
                render: (almacen) => (
                  <Badge variant="gold">
                    {almacen.codigo}
                  </Badge>
                ),
              },
              {
                key: 'nombre',
                header: 'Nombre',
                render: (almacen) => (
                  <div>
                    <p className="font-medium text-gray-900">
                      {almacen.nombre}
                    </p>

                    {almacen.ciudad && (
                      <p className="text-xs text-gray-500">
                        {almacen.ciudad}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: 'sucursalNombre',
                header: 'Sucursal',
                render: (almacen) => (
                  <span className="text-sm text-gray-600">
                    {almacen.sucursalNombre ?? 'Sin sucursal'}
                  </span>
                ),
              },
              {
                key: 'tipoAlmacen',
                header: 'Tipo',
                render: (almacen) => (
                  <Badge variant="neutral">
                    {almacen.tipoAlmacen || 'No especificado'}
                  </Badge>
                ),
              },
              {
                key: 'responsable',
                header: 'Responsable',
                render: (almacen) => (
                  <span className="text-sm text-gray-600">
                    {almacen.responsable || '—'}
                  </span>
                ),
              },
              {
                key: 'estado',
                header: 'Estado',
                render: (almacen) => (
                  <div className="space-y-1">
                    <Badge
                      variant={
                        almacen.estado === 'Activo'
                          ? 'success'
                          : 'neutral'
                      }
                    >
                      {ESTADO_LABEL[almacen.estado]}
                    </Badge>

                    {almacen.bloqueado && (
                      <div>
                        <Badge variant="warning">
                          Bloqueado
                        </Badge>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (almacen) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={changingId === almacen.id}
                      className="text-xs font-medium text-corporate hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => void toggleEstado(almacen)}
                    >
                      {changingId === almacen.id
                        ? 'Procesando...'
                        : almacen.estado === 'Activo'
                          ? 'Desactivar'
                          : 'Activar'}
                    </button>

                    <TableActions
                      onView={() =>
                        navigate(
                          `/inventario/almacenes/ver/${almacen.id}`,
                        )
                      }
                      onEdit={() =>
                        navigate(
                          `/inventario/almacenes/editar/${almacen.id}`,
                        )
                      }
                    />
                  </div>
                ),
              },
            ]}
          />

          {!loading && filtered.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                No se encontraron almacenes.
              </p>
            </div>
          )}

          {loading && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                Cargando almacenes...
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}