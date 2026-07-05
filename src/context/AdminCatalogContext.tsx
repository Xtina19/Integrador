import { createContext, useContext, useMemo, useState } from 'react'
import {
  adminProducts as seedProducts,
  adminCategories as seedCategories,
  adminPublishers as seedPublishers,
  adminBranches as seedBranches,
  adminSuppliers as seedSuppliers,
  adminCurrencies as seedCurrencies,
  adminExchangeRates as seedExchangeRates,
} from '@/mocks/mockAdmin'
import { useToast } from './ToastContext'

type Product = (typeof seedProducts)[number]
type Category = (typeof seedCategories)[number]
type Publisher = (typeof seedPublishers)[number]
type Branch = (typeof seedBranches)[number]
type Supplier = (typeof seedSuppliers)[number]
type Currency = (typeof seedCurrencies)[number]
type ExchangeRate = (typeof seedExchangeRates)[number]

interface AdminCatalogContextValue {
  products: Product[]
  categories: Category[]
  publishers: Publisher[]
  branches: Branch[]
  suppliers: Supplier[]
  currencies: Currency[]
  exchangeRates: ExchangeRate[]
  updateProduct: (id: string, data: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateCategory: (id: string, data: Partial<Category>) => void
  deleteCategory: (id: string) => void
  updatePublisher: (id: string, data: Partial<Publisher>) => void
  deletePublisher: (id: string) => void
  updateBranch: (id: string, data: Partial<Branch>) => void
  deleteBranch: (id: string) => void
  updateSupplier: (id: string, data: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void
  updateCurrency: (id: string, data: Partial<Currency>) => void
  deleteCurrency: (id: string) => void
  updateExchangeRate: (id: string, data: Partial<ExchangeRate>) => void
  deleteExchangeRate: (id: string) => void
}

const AdminCatalogContext = createContext<AdminCatalogContextValue | null>(null)

function makeUpdater<T extends { id: string }>(
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  showSuccess: (msg: string) => void,
  label: string
) {
  return {
    update: (id: string, data: Partial<T>) => {
      setState((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)))
      showSuccess(`${label} actualizado correctamente`)
    },
    remove: (id: string) => {
      setState((prev) => prev.filter((item) => item.id !== id))
      showSuccess(`${label} eliminado correctamente`)
    },
  }
}

export function AdminCatalogProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess } = useToast()
  const [products, setProducts] = useState([...seedProducts])
  const [categories, setCategories] = useState([...seedCategories])
  const [publishers, setPublishers] = useState([...seedPublishers])
  const [branches, setBranches] = useState([...seedBranches])
  const [suppliers, setSuppliers] = useState([...seedSuppliers])
  const [currencies, setCurrencies] = useState([...seedCurrencies])
  const [exchangeRates, setExchangeRates] = useState([...seedExchangeRates])

  const productOps = useMemo(() => makeUpdater(setProducts, showSuccess, 'Producto'), [showSuccess])
  const categoryOps = useMemo(() => makeUpdater(setCategories, showSuccess, 'Categoría'), [showSuccess])
  const publisherOps = useMemo(() => makeUpdater(setPublishers, showSuccess, 'Editorial'), [showSuccess])
  const branchOps = useMemo(() => makeUpdater(setBranches, showSuccess, 'Sucursal'), [showSuccess])
  const supplierOps = useMemo(() => makeUpdater(setSuppliers, showSuccess, 'Proveedor'), [showSuccess])
  const currencyOps = useMemo(() => makeUpdater(setCurrencies, showSuccess, 'Moneda'), [showSuccess])
  const rateOps = useMemo(() => makeUpdater(setExchangeRates, showSuccess, 'Tasa de cambio'), [showSuccess])

  const value = useMemo(
    () => ({
      products,
      categories,
      publishers,
      branches,
      suppliers,
      currencies,
      exchangeRates,
      updateProduct: productOps.update,
      deleteProduct: productOps.remove,
      updateCategory: categoryOps.update,
      deleteCategory: categoryOps.remove,
      updatePublisher: publisherOps.update,
      deletePublisher: publisherOps.remove,
      updateBranch: branchOps.update,
      deleteBranch: branchOps.remove,
      updateSupplier: supplierOps.update,
      deleteSupplier: supplierOps.remove,
      updateCurrency: currencyOps.update,
      deleteCurrency: currencyOps.remove,
      updateExchangeRate: rateOps.update,
      deleteExchangeRate: rateOps.remove,
    }),
    [products, categories, publishers, branches, suppliers, currencies, exchangeRates, productOps, categoryOps, publisherOps, branchOps, supplierOps, currencyOps, rateOps]
  )

  return <AdminCatalogContext.Provider value={value}>{children}</AdminCatalogContext.Provider>
}

export function useAdminCatalog() {
  const ctx = useContext(AdminCatalogContext)
  if (!ctx) throw new Error('useAdminCatalog debe usarse dentro de AdminCatalogProvider')
  return ctx
}

export type { Product, Category, Publisher, Branch, Supplier, Currency, ExchangeRate }
