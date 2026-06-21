export const eventBudgets = [
  { eventId: 'EV-001', eventName: 'Feria del Libro SD 2026', budget: 85000, spent: 42300, remaining: 42700 },
  { eventId: 'EV-002', eventName: 'Noche de Poesía', budget: 12000, spent: 8500, remaining: 3500 },
  { eventId: 'EV-003', eventName: 'Feria Infantil', budget: 25000, spent: 5200, remaining: 19800 },
]

export const eventCosts = [
  { id: 'EC-001', event: 'Feria del Libro SD 2026', concept: 'Alquiler de stand', amount: 18000, date: '2026-05-15' },
  { id: 'EC-002', event: 'Feria del Libro SD 2026', concept: 'Material promocional', amount: 8500, date: '2026-05-20' },
  { id: 'EC-003', event: 'Noche de Poesía', concept: 'Honorarios presentador', amount: 5000, date: '2026-06-01' },
]

export const eventIncome = [
  { id: 'EI-001', event: 'Feria del Libro SD 2026', concept: 'Ventas en feria', amount: 125400, date: '2026-06-06' },
  { id: 'EI-002', event: 'Noche de Poesía', concept: 'Entradas', amount: 4200, date: '2026-06-10' },
]

export const eventPublishers = [
  { eventId: 'EV-001', eventName: 'Feria del Libro SD 2026', publisher: 'Planeta', stand: 'A-12', products: 45 },
  { eventId: 'EV-001', eventName: 'Feria del Libro SD 2026', publisher: 'Alfaguara', stand: 'A-14', products: 38 },
  { eventId: 'EV-001', eventName: 'Feria del Libro SD 2026', publisher: 'Penguin Random House', stand: 'B-03', products: 52 },
]

export const eventStaff = [
  { eventId: 'EV-001', eventName: 'Feria del Libro SD 2026', employee: 'María González', role: 'Coordinadora', shift: '08:00–16:00' },
  { eventId: 'EV-001', eventName: 'Feria del Libro SD 2026', employee: 'Carlos Rodríguez', role: 'Vendedor', shift: '10:00–18:00' },
  { eventId: 'EV-002', eventName: 'Noche de Poesía', employee: 'Ana Martínez', role: 'Coordinadora', shift: '18:00–22:00' },
]
