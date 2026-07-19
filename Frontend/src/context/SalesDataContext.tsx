import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { salesHistory as seedSales, creditNotesSeed, productExchangesSeed } from '@/mocks/mockVentas'
import { useToast } from './ToastContext'
import type { CreditNote, ProductExchangeRecord } from '@/modules/ventas/types/salesExchange'
import { formatDop } from '@/lib/money'

export type SaleRecord = (typeof seedSales)[number]

export interface RegisterExchangeInput {
  invoiceId: string
  originalProductId: string
  originalProductTitle: string
  originalUnitPrice: number
  newProductId: string
  newProductTitle: string
  newUnitPrice: number
  qty: number
  reason: string
  generateCreditNote: boolean
  user?: string
}

interface RegisterExchangeResult {
  success: boolean
  errors?: string[]
  exchange?: ProductExchangeRecord
  creditNote?: CreditNote
}

interface SalesDataContextValue {
  salesHistory: SaleRecord[]
  productExchanges: ProductExchangeRecord[]
  creditNotes: CreditNote[]
  registerProductExchange: (input: RegisterExchangeInput) => RegisterExchangeResult
  getCreditNotesByInvoice: (invoiceId: string) => CreditNote[]
  getExchangesByInvoice: (invoiceId: string) => ProductExchangeRecord[]
}

const SalesDataContext = createContext<SalesDataContextValue | null>(null)

let exchangeCounter = productExchangesSeed.length
let creditNoteCounter = creditNotesSeed.length

function nextExchangeId(): string {
  exchangeCounter += 1
  return `CAM-2026-${String(exchangeCounter).padStart(3, '0')}`
}

function nextCreditNoteId(): string {
  creditNoteCounter += 1
  return `NC-2026-${String(creditNoteCounter).padStart(3, '0')}`
}

function formatNow(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export function SalesDataProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess } = useToast()
  const [salesHistory] = useState([...seedSales])
  const [productExchanges, setProductExchanges] = useState<ProductExchangeRecord[]>(() => [...productExchangesSeed])
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => [...creditNotesSeed])

  const getExchangesByInvoice = useCallback(
    (invoiceId: string) => productExchanges.filter((e) => e.invoiceId === invoiceId),
    [productExchanges]
  )

  const getCreditNotesByInvoice = useCallback(
    (invoiceId: string) => creditNotes.filter((n) => n.invoiceId === invoiceId),
    [creditNotes]
  )

  const registerProductExchange = useCallback(
    (input: RegisterExchangeInput): RegisterExchangeResult => {
      const sale = salesHistory.find((s) => s.id === input.invoiceId)
      if (!sale) {
        return { success: false, errors: ['No se encontró la factura.'] }
      }
      if (sale.status !== 'paid') {
        return { success: false, errors: ['Solo se permiten cambios sobre facturas pagadas.'] }
      }

      const originalItem = sale.items.find((i) => i.productId === input.originalProductId)
      if (!originalItem) {
        return { success: false, errors: ['El producto entregado no pertenece a esta factura.'] }
      }

      if (input.qty <= 0) {
        return { success: false, errors: ['La cantidad debe ser mayor a cero.'] }
      }

      const alreadyExchanged = productExchanges
        .filter((e) => e.invoiceId === input.invoiceId && e.originalProductId === input.originalProductId)
        .reduce((sum, e) => sum + e.qty, 0)

      if (input.qty + alreadyExchanged > originalItem.qty) {
        return { success: false, errors: ['No puede cambiar una cantidad mayor a la comprada.'] }
      }

      const priceDifference = (input.newUnitPrice - input.originalUnitPrice) * input.qty
      const date = formatNow()
      const exchangeId = nextExchangeId()
      let creditNote: CreditNote | undefined

      if (priceDifference < 0 && input.generateCreditNote) {
        creditNote = {
          id: nextCreditNoteId(),
          invoiceId: input.invoiceId,
          exchangeId,
          date,
          reason: input.reason,
          amount: Math.abs(priceDifference),
          status: 'active',
        }
        setCreditNotes((prev) => [...prev, creditNote!])
      }

      if (priceDifference < 0 && !input.generateCreditNote) {
        return {
          success: false,
          errors: ['El saldo a favor debe resolverse generando una Nota de Crédito.'],
        }
      }

      const exchange: ProductExchangeRecord = {
        id: exchangeId,
        invoiceId: input.invoiceId,
        originalProductId: input.originalProductId,
        originalProductTitle: input.originalProductTitle,
        newProductId: input.newProductId,
        newProductTitle: input.newProductTitle,
        qty: input.qty,
        reason: input.reason,
        priceDifference,
        creditNoteId: creditNote?.id,
        user: input.user ?? 'Usuario actual',
        date,
      }

      setProductExchanges((prev) => [...prev, exchange])

      if (creditNote) {
        showSuccess(`Nota de crédito ${creditNote.id} generada por ${formatDop(creditNote.amount)}`)
      } else if (priceDifference > 0) {
        showSuccess(`Cambio registrado. Cobro adicional de ${formatDop(priceDifference)} pendiente de registro.`)
      } else {
        showSuccess('Cambio de producto registrado correctamente')
      }

      return { success: true, exchange, creditNote }
    },
    [salesHistory, productExchanges, showSuccess]
  )

  const value = useMemo(
    () => ({
      salesHistory,
      productExchanges,
      creditNotes,
      registerProductExchange,
      getCreditNotesByInvoice,
      getExchangesByInvoice,
    }),
    [salesHistory, productExchanges, creditNotes, registerProductExchange, getCreditNotesByInvoice, getExchangesByInvoice]
  )

  return <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>
}

export function useSalesData() {
  const ctx = useContext(SalesDataContext)
  if (!ctx) throw new Error('useSalesData debe usarse dentro de SalesDataProvider')
  return ctx
}
