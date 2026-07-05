import type { EventAssociatedSale, EventExtendedData, EventHistoryEntry } from '../types/eventExtended'

export const eventBudgets = [
  { eventId: 'EV-01', eventName: 'Feria Internacional del Libro CDMX', budget: 250000, spent: 47100, remaining: 202900 },
  { eventId: 'EV-02', eventName: 'Presentación: Nuevo catálogo infantil', budget: 12000, spent: 5500, remaining: 6500 },
  { eventId: 'EV-03', eventName: 'Feria del Libro Guadalajara', budget: 180000, spent: 0, remaining: 180000 },
  { eventId: 'EV-04', eventName: 'Club de lectura mensual', budget: 8000, spent: 3200, remaining: 4800 },
]

export const eventCosts = [
  { id: 'EC-001', event: 'Feria Internacional del Libro CDMX', concept: 'Alquiler de stand', amount: 18000, date: '2026-05-15' },
  { id: 'EC-002', event: 'Feria Internacional del Libro CDMX', concept: 'Material promocional', amount: 8500, date: '2026-05-20' },
  { id: 'EC-003', event: 'Presentación: Nuevo catálogo infantil', concept: 'Honorarios presentador', amount: 3500, date: '2026-06-01' },
  { id: 'EC-004', event: 'Club de lectura mensual', concept: 'Refrigerios y materiales', amount: 1200, date: '2026-06-18' },
]

export const eventIncome = [
  { id: 'EI-001', event: 'Feria Internacional del Libro CDMX', concept: 'Ventas en feria', amount: 125400, date: '2026-06-06' },
  { id: 'EI-002', event: 'Presentación: Nuevo catálogo infantil', concept: 'Ventas en evento', amount: 4200, date: '2026-06-10' },
  { id: 'EI-003', event: 'Club de lectura mensual', concept: 'Inscripciones', amount: 1750, date: '2026-06-20' },
]

export const eventPublishers = [
  { eventId: 'EV-01', eventName: 'Feria Internacional del Libro CDMX', publisher: 'Planeta', stand: 'A-12', products: 45 },
  { eventId: 'EV-01', eventName: 'Feria Internacional del Libro CDMX', publisher: 'Alfaguara', stand: 'A-14', products: 38 },
  { eventId: 'EV-01', eventName: 'Feria Internacional del Libro CDMX', publisher: 'Penguin Random House', stand: 'B-03', products: 52 },
  { eventId: 'EV-02', eventName: 'Presentación: Nuevo catálogo infantil', publisher: 'Salamandra', stand: 'S-01', products: 12 },
  { eventId: 'EV-03', eventName: 'Feria del Libro Guadalajara', publisher: 'Debate', stand: 'C-08', products: 30 },
]

export const eventExtendedSeed: EventExtendedData[] = [
  {
    eventId: 'EV-01',
    publishers: ['Planeta', 'Alfaguara', 'Penguin Random House'],
    capacity: 5000,
    notes: 'Stand principal en pabellón A. Coordinación con logística para montaje el 14 de junio.',
    operationalCost: 15000,
    inventory: [
      { id: 'EI-1', product: 'Cien años de soledad', code: 'P-001', isbn: '978-0307474728', qty: 40, originBranch: 'Almacén Central' },
      { id: 'EI-2', product: 'Harry Potter y la piedra filosofal', code: 'P-005', isbn: '978-8498384453', qty: 30, originBranch: 'Sucursal Centro' },
    ],
    utensils: [
      { id: 'EU-1', supplier: 'Mobiliario RD', utensil: 'Mesas', qty: 6, unitCost: 2500, notes: 'Mesas plegables 180cm' },
      { id: 'EU-2', supplier: 'Mobiliario RD', utensil: 'Sillas', qty: 24, unitCost: 150, notes: '' },
      { id: 'EU-3', supplier: 'Publicidad Express', utensil: 'Roll Up', qty: 3, unitCost: 4500, notes: 'Diseño corporativo' },
    ],
  },
  {
    eventId: 'EV-02',
    publishers: ['Salamandra'],
    capacity: 120,
    notes: 'Evento en curso. Solo ajustes de inventario adicional y utensilios permitidos.',
    operationalCost: 3500,
    inventory: [
      { id: 'EI-3', product: 'El principito', code: 'P-002', isbn: '978-0156012195', qty: 25, originBranch: 'Sucursal Coyoacán' },
      { id: 'EI-4', product: 'Harry Potter y la piedra filosofal', code: 'P-005', isbn: '978-8498384453', qty: 15, originBranch: 'Sucursal Coyoacán' },
    ],
    utensils: [
      { id: 'EU-4', supplier: 'Audio Visual Pro', utensil: 'Banners', qty: 2, unitCost: 1000, notes: 'Material promocional infantil' },
    ],
  },
  {
    eventId: 'EV-03',
    publishers: ['Debate', 'Planeta'],
    capacity: 8000,
    notes: 'Feria programada para noviembre. Presupuesto preliminar aprobado.',
    operationalCost: 0,
    inventory: [],
    utensils: [],
  },
  {
    eventId: 'EV-04',
    publishers: ['Debolsillo'],
    capacity: 40,
    notes: 'Club mensual en sucursal Polanco.',
    operationalCost: 2000,
    inventory: [
      { id: 'EI-5', product: 'La sombra del viento', code: 'P-007', isbn: '978-8497592432', qty: 10, originBranch: 'Sucursal Polanco' },
    ],
    utensils: [
      { id: 'EU-5', supplier: 'Mobiliario RD', utensil: 'Mesas', qty: 2, unitCost: 600, notes: '' },
    ],
  },
]

/** Ventas vinculadas por atributo interno eventId (Evento Asociado) — preparado para integración con Ventas/MySQL */
export const eventAssociatedSales: EventAssociatedSale[] = [
  { id: 'FAC-2026-1842', eventId: 'EV-01', date: '2026-06-06 14:32', customer: 'Cliente General', branch: 'Feria Internacional del Libro CDMX', total: 1850, status: 'paid' },
  { id: 'FAC-2026-1835', eventId: 'EV-01', date: '2026-06-06 11:15', customer: 'Cliente Institucional', branch: 'Feria Internacional del Libro CDMX', total: 4200, status: 'paid' },
  { id: 'FAC-2026-1828', eventId: 'EV-02', date: '2026-06-10 20:45', customer: 'Cliente General', branch: 'Presentación: Nuevo catálogo infantil', total: 680, status: 'paid' },
  { id: 'FAC-2026-1850', eventId: 'EV-04', date: '2026-06-20 19:00', customer: 'Cliente General', branch: 'Club de lectura mensual', total: 450, status: 'paid' },
]

export const eventHistorySeed: EventHistoryEntry[] = [
  { id: 'EH-1', eventId: 'EV-01', date: '2026-05-01', action: 'Evento creado', detail: 'Registro inicial en el sistema', user: 'admin@joselito.com' },
  { id: 'EH-2', eventId: 'EV-01', date: '2026-05-10', action: 'Personal asignado', detail: '12 colaboradores confirmados por rotación automática', user: 'admin@joselito.com' },
  { id: 'EH-3', eventId: 'EV-01', date: '2026-05-20', action: 'Inventario preparado', detail: '70 productos asignados para envío a feria', user: 'inventario@joselito.com' },
  { id: 'EH-4', eventId: 'EV-02', date: '2026-06-08', action: 'Evento iniciado', detail: 'Presentación en sucursal Coyoacán', user: 'admin@joselito.com' },
  { id: 'EH-5', eventId: 'EV-02', date: '2026-05-15', action: 'Evento creado', detail: 'Programación de presentación infantil', user: 'admin@joselito.com' },
  { id: 'EH-6', eventId: 'EV-04', date: '2026-06-01', action: 'Evento creado', detail: 'Club de lectura mensual programado', user: 'admin@joselito.com' },
]

export function getEventSales(eventId: string): EventAssociatedSale[] {
  return eventAssociatedSales.filter((s) => s.eventId === eventId)
}

export function getEventHistory(eventId: string): EventHistoryEntry[] {
  return eventHistorySeed.filter((h) => h.eventId === eventId)
}
