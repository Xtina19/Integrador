import { useState, useMemo } from 'react'
import { Search, Plus, Minus, Trash2, CreditCard, X, Save, BookOpen } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { posProducts, posClientTypes } from '@/mocks/mockVentas'

interface CartItem {
  productId: string
  qty: number
  discount: number
}

export function POSPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [clientType, setClientType] = useState<string>(posClientTypes[0].value)
  const [cart, setCart] = useState<CartItem[]>([])

  const categories = useMemo(() => {
    const cats = [...new Set(posProducts.map((p) => p.category))]
    return cats.sort()
  }, [])

  const filteredProducts = useMemo(() => {
    return posProducts.filter((p) => {
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn.includes(search) ||
        p.author.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [search, categoryFilter])

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => {
        const product = posProducts.find((p) => p.id === item.productId)
        if (!product) return null
        const lineSubtotal = product.price * item.qty
        const discountAmount = lineSubtotal * (item.discount / 100)
        const lineTotal = lineSubtotal - discountAmount
        return { ...item, product, lineSubtotal, discountAmount, lineTotal }
      })
      .filter(Boolean) as Array<CartItem & {
        product: (typeof posProducts)[0]
        lineSubtotal: number
        discountAmount: number
        lineTotal: number
      }>
  }, [cart])

  const subtotal = cartDetails.reduce((sum, item) => sum + item.lineSubtotal, 0)
  const totalDiscount = cartDetails.reduce((sum, item) => sum + item.discountAmount, 0)
  const total = cartDetails.reduce((sum, item) => sum + item.lineTotal, 0)

  function addToCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { productId, qty: 1, discount: 0 }]
    })
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, qty } : item))
    )
  }

  function updateDiscount(productId: string, discount: number) {
    const clamped = Math.min(100, Math.max(0, discount))
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, discount: clamped } : item))
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  function handleCancel() {
    setCart([])
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-[calc(100vh-12rem)]">
      <div className="xl:col-span-3 space-y-4">
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  icon={Search}
                  placeholder="Buscar por título, ISBN o autor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                label="Categoría"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas las categorías' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="flex-1">
          <CardHeader title="Catálogo" />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-thin pr-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white hover:border-corporate/40 hover:bg-corporate/5 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0 group-hover:bg-corporate/15">
                    <BookOpen size={18} className="text-corporate" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                      {product.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{product.author}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-corporate">${product.price.toLocaleString()}</span>
                      <Badge variant={product.stock <= 5 ? 'warning' : 'neutral'}>
                        Stock: {product.stock}
                      </Badge>
                    </div>
                  </div>
                  <Plus size={18} className="text-corporate shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="xl:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader title="Carrito de Venta" />
          <CardBody className="flex-1 flex flex-col">
            <div className="mb-4">
              <Select
                label="Tipo de cliente"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                options={posClientTypes.map((c) => ({ value: c.value, label: c.label }))}
              />
            </div>
            {cartDetails.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-400">
                <ShoppingCartEmpty />
                <p className="text-sm mt-3">Seleccione productos del catálogo</p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-28rem)]">
                {cartDetails.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 rounded-lg bg-surface border border-gray-100 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 line-clamp-2">
                          {item.product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${item.product.price.toLocaleString()} c/u
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, item.qty - 1)}
                          className="p-1.5 hover:bg-gray-50 rounded-l-lg"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, item.qty + 1)}
                          className="p-1.5 hover:bg-gray-50 rounded-r-lg"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-1">
                        <label className="text-xs text-gray-500 whitespace-nowrap">Desc. %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discount}
                          onChange={(e) =>
                            updateDiscount(item.productId, Number(e.target.value) || 0)
                          }
                          className="w-16 rounded border border-gray-200 px-2 py-1 text-xs text-center focus:border-corporate focus:outline-none focus:ring-1 focus:ring-corporate/20"
                        />
                      </div>

                      <span className="text-sm font-semibold text-corporate ml-auto">
                        ${item.lineTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Descuentos</span>
                <span className="text-amber-600">-${totalDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-corporate pt-1">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button
                variant="secondary"
                icon={CreditCard}
                disabled={cartDetails.length === 0}
                className="col-span-1"
              >
                Cobrar
              </Button>
              <Button
                variant="outline"
                icon={X}
                onClick={handleCancel}
                disabled={cartDetails.length === 0}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                icon={Save}
                disabled={cartDetails.length === 0}
              >
                Guardar
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function ShoppingCartEmpty() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
