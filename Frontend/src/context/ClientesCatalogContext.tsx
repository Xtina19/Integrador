import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clientesApi } from '@/services/api/clientesApi'
import type { Cliente, ClienteDocumentoTipo, ClienteEstado, ClienteInput, ClienteTipo } from '@/types/clientes'
import { trim } from '@/utils/formValidation'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from './ToastContext'

interface ClientesCatalogContextValue {
  clientes: Cliente[]
  loading: boolean
  getById: (id: string) => Cliente | undefined
  buscarActivos: (texto: string) => Cliente[]
  createCliente: (input: ClienteInput, opts?: { creadoPor?: string }) => Promise<Cliente>
  updateCliente: (id: string, input: Partial<ClienteInput>, opts?: { actualizadoPor?: string }) => Promise<void>
  refresh: () => Promise<void>
}

const ClientesCatalogContext = createContext<ClientesCatalogContextValue | null>(null)

function mapApiCliente(raw: Record<string, unknown>, actor = 'Sistema'): Cliente {
  const fechaAlta = raw.fechaAlta ? String(raw.fechaAlta).slice(0, 10) : new Date().toISOString().slice(0, 10)
  const actualizadoEn = raw.actualizadoEn ? String(raw.actualizadoEn).slice(0, 10) : fechaAlta
  return {
    id: String(raw.id),
    codigo: String(raw.codigo || raw.id),
    nombre: String(raw.nombre || ''),
    tipo: (raw.tipo as ClienteTipo) || 'persona',
    documentoTipo: (raw.documentoTipo as ClienteDocumentoTipo) || 'cedula',
    documento: String(raw.documento || ''),
    telefono: String(raw.telefono || ''),
    correo: String(raw.correo || ''),
    institucion: String(raw.institucion || ''),
    sucursalPreferidaId: String(raw.sucursalPreferidaId || ''),
    estado: (raw.estado as ClienteEstado) || 'activo',
    observaciones: String(raw.observaciones || ''),
    fechaAlta,
    creadoPor: String(raw.creadoPor || actor),
    actualizadoEn,
    actualizadoPor: String(raw.actualizadoPor || actor),
  }
}

function toApiBody(input: Partial<ClienteInput>) {
  const body: Record<string, unknown> = {}
  if (input.nombre !== undefined) body.nombre = trim(input.nombre)
  if (input.documento !== undefined) body.documento = trim(input.documento) || null
  if (input.telefono !== undefined) body.telefono = trim(input.telefono) || null
  if (input.correo !== undefined) body.correo = trim(input.correo) || null
  if (input.estado !== undefined) body.estado = input.estado
  if (input.tipo !== undefined) body.tipo = input.tipo
  if (input.documentoTipo !== undefined) body.documentoTipo = input.documentoTipo
  if (input.institucion !== undefined) body.institucion = trim(input.institucion) || null
  if (input.sucursalPreferidaId !== undefined) body.sucursalPreferidaId = input.sucursalPreferidaId || null
  if (input.observaciones !== undefined) body.observaciones = trim(input.observaciones) || null
  return body
}

/**
 * Maestro de Clientes — única fuente de verdad editable (Administración).
 * Ventas no mantiene un catálogo paralelo ni sincroniza; recibe identidad en la emisión.
 */
export function ClientesCatalogProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess, showError } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = (await clientesApi.list()) as Record<string, unknown>[]
      setClientes(list.map((r) => mapApiCliente(r)))
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const getById = useCallback((id: string) => clientes.find((c) => c.id === id), [clientes])

  const buscarActivos = useCallback(
    (texto: string) => {
      const q = texto.trim().toLowerCase()
      if (!q) return []
      return clientes.filter((c) => {
        if (c.estado !== 'activo') return false
        return (
          c.nombre.toLowerCase().includes(q) ||
          c.codigo.toLowerCase().includes(q) ||
          c.documento.toLowerCase().includes(q) ||
          c.institucion.toLowerCase().includes(q)
        )
      })
    },
    [clientes],
  )

  const createCliente = useCallback(
    async (input: ClienteInput, opts?: { creadoPor?: string }) => {
      const actor = opts?.creadoPor ?? 'Administración'
      try {
        const created = (await clientesApi.create(toApiBody(input))) as Record<string, unknown>
        const creado = mapApiCliente(created, actor)
        setClientes((prev) => [...prev, creado])
        showSuccess(`Cliente ${creado.codigo} registrado`)
        return creado
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
        throw err
      }
    },
    [showSuccess, showError],
  )

  const updateCliente = useCallback(
    async (id: string, input: Partial<ClienteInput>, opts?: { actualizadoPor?: string }) => {
      const actor = opts?.actualizadoPor ?? 'Administración'
      try {
        const updated = (await clientesApi.update(id, toApiBody(input))) as Record<string, unknown>
        const mapped = mapApiCliente(updated, actor)
        setClientes((prev) => prev.map((c) => (c.id === id ? mapped : c)))
        showSuccess('Cliente actualizado correctamente')
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
        throw err
      }
    },
    [showSuccess, showError],
  )

  const value = useMemo(
    () => ({ clientes, loading, getById, buscarActivos, createCliente, updateCliente, refresh }),
    [clientes, loading, getById, buscarActivos, createCliente, updateCliente, refresh],
  )

  return <ClientesCatalogContext.Provider value={value}>{children}</ClientesCatalogContext.Provider>
}

export function useClientesCatalog() {
  const ctx = useContext(ClientesCatalogContext)
  if (!ctx) throw new Error('useClientesCatalog must be used within ClientesCatalogProvider')
  return ctx
}
