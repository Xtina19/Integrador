import { computeEventBudgetSummary } from '@/modules/eventos/utils/eventBudget'
import type { EventUtensil } from '@/modules/eventos/types/eventExtended'

interface EventBudgetSummaryProps {
  budget: number
  utensils: EventUtensil[]
  operationalCost: number
  onOperationalCostChange?: (value: number) => void
  readOnly?: boolean
}

export function EventBudgetSummary({
  budget,
  utensils,
  operationalCost,
  onOperationalCostChange,
  readOnly = false,
}: EventBudgetSummaryProps) {
  const summary = computeEventBudgetSummary(budget, utensils, operationalCost)

  return (
    <div className="rounded-lg border border-gray-200 bg-surface p-6 space-y-4 max-w-md">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-600">Presupuesto asignado</span>
        <span className="text-xl font-bold text-corporate">RD${summary.budget.toLocaleString()}</span>
      </div>
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Costo utensilios</span>
          <span className="font-medium">RD${summary.utensilsCost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm items-center gap-4">
          <span className="text-gray-600">Costo operativo</span>
          {readOnly || !onOperationalCostChange ? (
            <span className="font-medium">RD${summary.operationalCost.toLocaleString()}</span>
          ) : (
            <input
              type="number"
              min={0}
              className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-sm text-right focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20"
              value={operationalCost || ''}
              onChange={(e) => onOperationalCostChange(Number(e.target.value) || 0)}
            />
          )}
        </div>
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
          <span className="text-gray-800">Total Gastado</span>
          <span className="text-corporate">RD${summary.totalSpent.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-800">Disponible</span>
          <span className={summary.available >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            RD${summary.available.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
