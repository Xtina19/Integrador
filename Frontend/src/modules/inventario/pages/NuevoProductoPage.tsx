/**
 * Alta operativa de existencia por almacén.
 * No crea productos: selecciona del Catálogo Maestro (Administración → Productos).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { useProductosMaestro } from '@/hooks/useProductosMaestro'
import { almacenesApi } from '@/services/api/almacenesApi'
import { existenciasApi } from '@/services/api/existenciasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { trim } from '@/utils/formValidation'

type AlmacenOption = { id: string; nombre: string }

export function NuevoProductoPage() {
  const { showSuccess, showError } = useToast()
  const { productos, loading: loadingProductos, error: catalogError } = useProductosMaestro()
  const [almacenes, setAlmacenes] = useState<AlmacenOption[]>([])
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    productoId: '',
    almacenId: '',
    stockInicial: '0',
    stockMinimo: '0',
    ubicacion: '',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingAlmacenes(true)
      try {
        const rows = await almacenesApi.list()
        if (cancelled) return
        const list = (rows as Record<string, unknown>[])
          .map((r) => ({
            id: String(r.id ?? ''),
            nombre: String(r.nombre ?? r.name ?? r.id ?? ''),
          }))
          .filter((a) => a.id)
        setAlmacenes(list)
        if (list[0] && !form.almacenId) {
          setForm((f) => ({ ...f, almacenId: list[0].id }))
        }
      } catch (e) {
        if (!cancelled) setError(getFriendlyErrorMessage(e))
      } finally {
        if (!cancelled) setLoadingAlmacenes(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo carga inicial de almacenes
  }, [])

  useEffect(() => {
    if (!form.productoId && productos[0]) {
      setForm((f) => ({ ...f, productoId: productos[0].id }))
    }
  }, [productos, form.productoId])

  const selected = useMemo(
    () => productos.find((p) => p.id === form.productoId),
    [productos, form.productoId],
  )

  const validationErrors = useMemo(() => {
    const errs: string[] = []
    if (!form.productoId) errs.push('Seleccione un producto del catálogo maestro.')
    if (!form.almacenId) errs.push('Seleccione un almacén.')
    const stock = Number(form.stockInicial)
    if (!Number.isInteger(stock) || stock < 0) errs.push('Stock inicial debe ser un entero ≥ 0.')
    const min = Number(form.stockMinimo)
    if (!Number.isInteger(min) || min < 0) errs.push('Stock mínimo debe ser un entero ≥ 0.')
    if (!trim(form.ubicacion) || trim(form.ubicacion).length < 2) {
      errs.push('Ubicación es obligatoria (mín. 2 caracteres).')
    }
    return errs
  }, [form])

  const loading = loadingProductos || loadingAlmacenes

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Registrar existencia' },
      ]}
      title="Registrar existencia"
      subtitle="Seleccione un producto del catálogo maestro e indique stock por almacén"
      listPath="/inventario"
      saveDisabled={loading || validationErrors.length > 0}
      onSave={async () => {
        if (validationErrors.length) {
          setError(validationErrors[0])
          return false
        }
        if (!selected) {
          setError('Producto no encontrado en el catálogo.')
          return false
        }
        try {
          setError('')
          await existenciasApi.registrar({
            productoId: selected.id,
            almacenId: form.almacenId,
            stockInicial: Number(form.stockInicial) || 0,
            stockMinimo: Number(form.stockMinimo) || 0,
            ubicacion: trim(form.ubicacion),
            codigo: selected.code,
            isbn: selected.isbn,
            titulo: selected.title,
            autor: selected.author,
            categoria: selected.category,
            editorial: selected.publisher,
            costoReferencia: selected.cost || selected.price,
            precio: selected.price,
          })
          showSuccess('Existencia registrada')
          return true
        } catch (e) {
          const msg = getFriendlyErrorMessage(e)
          setError(msg)
          showError(msg)
          return false
        }
      }}
    >
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Los datos maestros (ISBN, título, categoría, editorial) se gestionan en{' '}
        <Link to="/inventario/productos" className="font-semibold underline hover:no-underline">
          Catálogo de Productos
        </Link>
        . Aquí solo se registra la existencia operativa por almacén.
      </div>

      {(error || catalogError || validationErrors[0]) && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {error || catalogError || validationErrors[0]}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando catálogo…</p>
      ) : productos.length === 0 ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          No hay productos en el catálogo maestro.{' '}
          <Link to="/inventario/productos/nuevo" className="font-semibold underline">
            Crear producto en Administración
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Producto *"
            value={form.productoId}
            onChange={(e) => setForm({ ...form, productoId: e.target.value })}
            options={productos.map((p) => ({
              value: p.id,
              label: `${p.code ? `${p.code} · ` : ''}${p.title}`,
            }))}
            className="md:col-span-2"
          />
          {selected && (
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-surface border border-gray-100 px-4 py-3 text-sm text-gray-600">
              <div>
                <span className="text-xs uppercase text-gray-400">ISBN</span>
                <p className="font-mono">{selected.isbn || '—'}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-gray-400">Categoría</span>
                <p>{selected.category || '—'}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-gray-400">Editorial</span>
                <p>{selected.publisher || '—'}</p>
              </div>
            </div>
          )}
          <Select
            label="Almacén *"
            value={form.almacenId}
            onChange={(e) => setForm({ ...form, almacenId: e.target.value })}
            options={almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
          />
          <Input
            label="Ubicación *"
            value={form.ubicacion}
            onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            placeholder="Ej. Pasillo A · Estante 3"
          />
          <Input
            label="Stock inicial *"
            type="number"
            min={0}
            value={form.stockInicial}
            onChange={(e) => setForm({ ...form, stockInicial: e.target.value })}
          />
          <Input
            label="Stock mínimo *"
            type="number"
            min={0}
            value={form.stockMinimo}
            onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
          />
        </div>
      )}
    </FormPageLayout>
  )
}
