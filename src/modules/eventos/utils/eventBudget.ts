import type { EventUtensil } from '@/modules/eventos/types/eventExtended'

export function computeUtensilsCost(utensils: EventUtensil[]): number {
  return utensils.reduce((sum, u) => sum + u.qty * u.unitCost, 0)
}

export function computeEventBudgetSummary(
  budget: number,
  utensils: EventUtensil[],
  operationalCost: number
) {
  const utensilsCost = computeUtensilsCost(utensils)
  const totalSpent = utensilsCost + operationalCost
  const available = budget - totalSpent
  return { budget, utensilsCost, operationalCost, totalSpent, available }
}
