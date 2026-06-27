import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { salesHistory as seedSales, returns as seedReturns } from '../data/salesMockData'
import { useToast } from './ToastContext'

export type SaleRecord = (typeof seedSales)[number]
export type ReturnRecord = (typeof seedReturns)[number]

interface SalesDataContextValue {
  salesHistory: SaleRecord[]
  returns: ReturnRecord[]
  updateReturnStatus: (id: string, status: ReturnRecord['status']) => void
}

const SalesDataContext = createContext<SalesDataContextValue | null>(null)

export function SalesDataProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess } = useToast()
  const [salesHistory] = useState([...seedSales])
  const [returns, setReturns] = useState([...seedReturns])

  const updateReturnStatus = useCallback(
    (id: string, status: ReturnRecord['status']) => {
      setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      const label = status === 'approved' ? 'aprobada' : status === 'rejected' ? 'rechazada' : 'actualizada'
      showSuccess(`Devolución ${id} ${label}`)
    },
    [showSuccess]
  )

  const value = useMemo(
    () => ({ salesHistory, returns, updateReturnStatus }),
    [salesHistory, returns, updateReturnStatus]
  )

  return <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>
}

export function useSalesData() {
  const ctx = useContext(SalesDataContext)
  if (!ctx) throw new Error('useSalesData debe usarse dentro de SalesDataProvider')
  return ctx
}
