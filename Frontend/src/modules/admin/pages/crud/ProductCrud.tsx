import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { validateAdminProduct } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { productosApi } from '@/services/api/productosApi'
import { categoriasApi } from '@/services/api/categoriasApi'
import { editorialesApi } from '@/services/api/editorialesApi'
import { ensureCode } from '@/services/api/httpList'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.productos
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

type Product = {
  id: string
  code: string
  isbn: string
  title: string
  author: string
  category: string
  categoryId: string
  publisher: string
  publisherId: string
  price: number
  currency: string
  status: string
  createdAt?: string
  updatedAt?: string
}

type CatalogOption = { id: string; name: string }

const emptyForm = {
  code: '',
  isbn: '',
  title: '',
  author: '',
  categoryId: '',
  publisherId: '',
  price: '',
  currency: 'DOP',
  status: 'active',
  notes: '',
}

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [allCodes, setAllCodes] = useState<string[]>([])
  const [allIsbns, setAllIsbns] = useState<string[]>([])
  const [categories, setCategories] = useState<CatalogOption[]>([])
  const [publishers, setPublishers] = useState<CatalogOption[]>([])
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [products, cats, pubs] = await Promise.all([
          productosApi.list(),
          categoriasApi.list(),
          editorialesApi.list(),
        ])
        if (cancelled) return
        const list = products as Product[]
        setAllCodes(list.map((p) => p.code))
        setAllIsbns(list.map((p) => p.isbn).filter(Boolean))
        setCategories((cats as CatalogOption[]).map((c) => ({ id: c.id, name: c.name })))
        setPublishers((pubs as CatalogOption[]).map((p) => ({ id: p.id, name: p.name })))
        if (isEdit && id) {
          const found = list.find((p) => p.id === id) ?? ((await productosApi.getById(id)) as Product)
          if (cancelled) return
          setExisting(found)
          setForm({
            code: found.code,
            isbn: found.isbn,
            title: found.title,
            author: found.author,
            categoryId: found.categoryId || '',
            publisherId: found.publisherId || '',
            price: String(found.price),
            currency: found.currency || 'DOP',
            status: found.status,
            notes: '',
          })
        }
      } catch {
        if (isEdit) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const validation = useMemo(
    () =>
      validateAdminProduct(
        {
          ...form,
          category: form.categoryId,
          publisher: form.publisherId,
        },
        allCodes,
        allIsbns,
        existing?.code,
        existing?.isbn
      ),
    [form, allCodes, allIsbns, existing]
  )

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="producto" listPath={config.basePath} />
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando producto…</p>
  }

  const buildPayload = () => ({
    code: ensureCode('PRD', trim(form.title), trim(form.code) || existing?.code, allCodes),
    isbn: trim(form.isbn),
    title: trim(form.title),
    author: trim(form.author),
    categoryId: form.categoryId || undefined,
    publisherId: form.publisherId || undefined,
    price: Number(form.price) || 0,
    status: form.status,
  })

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const payload = buildPayload()
        if (isEdit && id) {
          await productosApi.update(id, payload)
          showSuccess('Producto actualizado')
        } else {
          await productosApi.create(payload)
          showSuccess('Producto creado')
        }
        navigate(config.basePath)
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  const saveContinue = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        await productosApi.create(buildPayload())
        showSuccess('Producto creado')
        setForm(emptyForm)
        const list = (await productosApi.list()) as Product[]
        setAllCodes(list.map((p) => p.code))
        setAllIsbns(list.map((p) => p.isbn).filter(Boolean))
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <AdminFormLayout
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: isEdit ? config.editTitle : config.createTitle },
      ]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.code}` : 'Registro en catálogo maestro'}
      listPath={config.basePath}
      saveDisabled={!validation.valid}
      onSave={saveForm}
      onSaveContinue={!isEdit ? saveContinue : undefined}
    >
      {!validation.valid && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Código Interno" value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="Se genera si se deja vacío" />
        <Input label="ISBN *" value={form.isbn} onChange={(e) => update('isbn', e.target.value)} placeholder="978-XXXXXXXXXX" />
        <Input label="Título *" value={form.title} onChange={(e) => update('title', e.target.value)} className="md:col-span-2" />
        <Input label="Autor" value={form.author} onChange={(e) => update('author', e.target.value)} className="md:col-span-2" />
        <Select label="Categoría *" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Editorial *" value={form.publisherId} onChange={(e) => update('publisherId', e.target.value)} options={publishers.map((p) => ({ value: p.id, label: p.name }))} />
        <Input label="Precio *" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} />
        <Input label="Moneda" value={form.currency} disabled />
        <Select label="Estado" value={form.status} onChange={(e) => update('status', e.target.value)} options={statusOptions} />
        <Textarea label="Notas internas" value={form.notes} onChange={(e) => update('notes', e.target.value)} className="md:col-span-2" rows={3} />
      </div>
    </AdminFormLayout>
  )
}

export function ProductDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      try {
        const row = (await productosApi.getById(id)) as Product
        if (!cancelled) setProduct(row)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-gray-500">Cargando producto…</p>
  if (notFound || !product) {
    return <RecordNotFound moduleLabel="producto" listPath={config.basePath} />
  }

  async function toggleEstado() {
    if (!product) return
    const next = product.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = (await productosApi.setEstado(product.id, next)) as Product
      setProduct(updated)
      showSuccess(next === 'active' ? 'Producto activado' : 'Producto desactivado')
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AdminDetailLayout
      config={config}
      id={product.id}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: config.detailTitle },
      ]}
      title={product.title}
      subtitle={`${product.code} · ISBN ${product.isbn}`}
      statusBadge={
        <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>
          {product.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      }
    >
      <div className="flex justify-end mb-4">
        <button type="button" className="text-sm font-medium text-corporate hover:underline" onClick={() => void toggleEstado()}>
          {product.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Código Interno" value={<span className="font-mono text-corporate">{product.code}</span>} />
            <DetailRow label="ISBN" value={<span className="font-mono">{product.isbn}</span>} />
            <DetailRow label="Autor" value={product.author} />
            <DetailRow label="Estado" value={<Badge variant={product.status === 'active' ? 'success' : 'neutral'}>{product.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
            {product.createdAt && <DetailRow label="Fecha registro" value={String(product.createdAt).slice(0, 10)} />}
            {product.updatedAt && <DetailRow label="Última actualización" value={String(product.updatedAt).slice(0, 10)} />}
          </dl>
        </DetailSection>

        <DetailSection title="Clasificación y Precio">
          <dl>
            <DetailRow label="Categoría" value={<Badge variant="neutral">{product.category}</Badge>} />
            <DetailRow label="Editorial" value={product.publisher} />
            <DetailRow label="Precio" value={<span className="text-lg font-bold text-corporate">RD${product.price.toLocaleString()}</span>} />
            <DetailRow label="Moneda" value={<Badge variant="gold">{product.currency}</Badge>} />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function ProductDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      try {
        const row = (await productosApi.getById(id)) as Product
        if (!cancelled) setProduct(row)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-gray-500">Cargando producto…</p>
  if (notFound || !product) {
    return <RecordNotFound moduleLabel="producto" listPath={config.basePath} />
  }

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: config.deleteTitle },
      ]}
      recordTitle={product.title}
      recordSubtitle={`${product.code} · ${product.publisher}`}
      recordSummary={[
        { label: 'ISBN', value: product.isbn },
        { label: 'Categoría', value: product.category },
        { label: 'Precio', value: `RD$${product.price.toLocaleString()}` },
        { label: 'Estado', value: product.status === 'active' ? 'Activo' : 'Inactivo' },
      ]}
      onConfirm={async () => {
        try {
          await productosApi.setEstado(product.id, 'inactive')
          showSuccess('Producto desactivado')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
