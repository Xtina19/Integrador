import type { Product, InventoryAdjustment, KardexMovement } from '../types/domain'
import type { ERPState } from '../store/initialState'
import { validateInventoryAdjustment } from '../business-rules/validators'
import { createActivity, createNotification } from '../services/activityService'
import { dashboardService } from '../services/dashboardService'
import { nextId, nextSimpleId } from '../utils/idGenerator'
import { nowFormatted } from '../utils/timeUtils'

export interface CreateProductInput {
  code: string
  isbn: string
  name: string
  category: string
  publisher: string
  stock: number
  minStock: number
  location: string
  cost: number
  price: number
}

export interface UpdateProductInput extends CreateProductInput {
  productId: string
}

export interface CreateAdjustmentInput {
  productTitle: string
  type: string
  qty: number
  reason: string
  notes?: string
}

export const inventoryService = {
  createProduct(state: ERPState, input: CreateProductInput) {
    const product: Product = {
      id: input.code || nextSimpleId('P'),
      isbn: input.isbn,
      title: input.name,
      author: '',
      category: input.category,
      publisher: input.publisher,
      stock: input.stock,
      minStock: input.minStock,
      location: input.location,
      status: input.stock <= input.minStock ? 'low' : 'normal',
      cost: input.cost,
      price: input.price,
    }

    const products = [...state.products, product]
    return {
      success: true as const,
      product,
      products,
      stockByCategory: dashboardService.recalcStockByCategory(products, state.stockByCategory),
      inventoryChartData: dashboardService.recalcInventoryChart(products, state.inventoryChartData),
      activity: createActivity(`Nuevo producto registrado: ${product.title}.`, 'Inventario'),
      notification: createNotification('success', 'Nuevo producto', product.title, 'Inventario'),
    }
  },

  createAdjustment(state: ERPState, input: CreateAdjustmentInput) {
    const validation = validateInventoryAdjustment(input.qty)
    if (!validation.valid) return { success: false as const, errors: validation.errors }

    const product = state.products.find((p) => p.title === input.productTitle)
    if (!product) return { success: false as const, errors: ['Producto no encontrado.'] }

    const delta = input.type === 'Salida' ? -input.qty : input.qty
    const newStock = Math.max(0, product.stock + delta)
    const minStock = product.minStock ?? 10

    const adjustment: InventoryAdjustment = {
      id: nextId('AJ'),
      date: nowFormatted().slice(0, 10),
      product: product.title,
      type: input.type,
      qty: input.qty,
      reason: input.reason,
      user: 'admin@joselito.com',
      status: 'approved',
      notes: input.notes,
    }

    const kardex: KardexMovement = {
      id: nextId('K'),
      date: nowFormatted(),
      product: product.title,
      isbn: product.isbn,
      type: input.type === 'Corrección' ? 'Ajuste' : input.type,
      qty: delta,
      balance: newStock,
      reference: adjustment.id,
      user: 'inventario@joselito.com',
    }

    const products = state.products.map((p) =>
      p.id === product.id
        ? {
            ...p,
            stock: newStock,
            status: (newStock === 0 ? 'out' : newStock <= minStock ? 'low' : 'normal') as Product['status'],
          }
        : p
    )

    const notif =
      newStock <= minStock
        ? createNotification('danger', 'Stock crítico', `${product.title} — ${newStock} uds.`, 'Inventario')
        : null

    return {
      success: true as const,
      adjustment,
      kardex,
      products,
      stockByCategory: dashboardService.recalcStockByCategory(products, state.stockByCategory),
      inventoryChartData: dashboardService.recalcInventoryChart(products, state.inventoryChartData),
      activity: createActivity(`Ajuste ${adjustment.id} — ${product.title} (${input.type}).`, 'Inventario'),
      notification: notif,
    }
  },

  applyReceptionToInventory(state: ERPState, orderId: string, items: number) {
    const order = state.purchaseOrders.find((o) => o.id === orderId)
    if (!order) return null

    const lineProduct = order.lines?.[0]?.product
    const product = lineProduct
      ? state.products.find((p) => p.title === lineProduct)
      : state.products[0]

    if (!product) return { products: state.products, kardex: null as KardexMovement | null }

    const qty = items || order.items
    const newStock = product.stock + qty
    const products = state.products.map((p) =>
      p.id === product.id ? { ...p, stock: newStock, status: 'normal' as const } : p
    )

    const kardex: KardexMovement = {
      id: nextId('K'),
      date: nowFormatted(),
      product: product.title,
      isbn: product.isbn,
      type: 'Entrada',
      qty,
      balance: newStock,
      reference: orderId,
      user: 'inventario@joselito.com',
    }

    return {
      products,
      kardex,
      stockByCategory: dashboardService.recalcStockByCategory(products, state.stockByCategory),
      inventoryChartData: dashboardService.recalcInventoryChart(products, state.inventoryChartData),
    }
  },

  updateProduct(state: ERPState, input: UpdateProductInput) {
    const product = state.products.find((p) => p.id === input.productId)
    if (!product) return { success: false as const, errors: ['Producto no encontrado.'] }

    const updated: Product = {
      ...product,
      isbn: input.isbn,
      title: input.name,
      category: input.category,
      publisher: input.publisher,
      stock: input.stock,
      minStock: input.minStock,
      location: input.location,
      cost: input.cost,
      price: input.price,
      status: (input.stock === 0 ? 'out' : input.stock <= input.minStock ? 'low' : 'normal') as Product['status'],
    }

    const products = state.products.map((p) => (p.id === input.productId ? updated : p))
    return {
      success: true as const,
      product: updated,
      products,
      stockByCategory: dashboardService.recalcStockByCategory(products, state.stockByCategory),
      inventoryChartData: dashboardService.recalcInventoryChart(products, state.inventoryChartData),
      activity: createActivity(`Producto actualizado: ${updated.title}.`, 'Inventario'),
    }
  },

  deleteProduct(state: ERPState, productId: string) {
    const product = state.products.find((p) => p.id === productId)
    if (!product) return { success: false as const, errors: ['Producto no encontrado.'] }
    const products = state.products.filter((p) => p.id !== productId)
    return {
      success: true as const,
      productId,
      products,
      stockByCategory: dashboardService.recalcStockByCategory(products, state.stockByCategory),
      inventoryChartData: dashboardService.recalcInventoryChart(products, state.inventoryChartData),
      activity: createActivity(`Producto eliminado: ${product.title}.`, 'Inventario'),
    }
  },
}
