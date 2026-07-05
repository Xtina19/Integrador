export const salesStats = {
  dailySales: 12450,
  monthlySales: 342800,
  avgTicket: 296,
  dailyTransactions: 42,
}

export const salesByBranch = [
  { name: 'Sucursal Centro', sales: 45200 },
  { name: 'Sucursal Polanco', sales: 38500 },
  { name: 'Sucursal Guadalajara', sales: 32100 },
  { name: 'Sucursal Monterrey', sales: 28900 },
  { name: 'Almacén Central', sales: 19800 },
]

export const monthlySales = [
  { month: 'Ene', sales: 285000 },
  { month: 'Feb', sales: 298000 },
  { month: 'Mar', sales: 312000 },
  { month: 'Abr', sales: 305000 },
  { month: 'May', sales: 328000 },
  { month: 'Jun', sales: 342800 },
]

export const topProducts = [
  { id: 'P-001', title: 'Cien años de soledad', qty: 145, revenue: 123250 },
  { id: 'P-005', title: 'Harry Potter y la piedra filosofal', qty: 98, revenue: 66640 },
  { id: 'P-003', title: '1984', qty: 87, revenue: 27840 },
  { id: 'P-007', title: 'La sombra del viento', qty: 76, revenue: 39520 },
]

export const posProducts = [
  { id: 'P-001', isbn: '978-0307474728', title: 'Cien años de soledad', author: 'Gabriel García Márquez', price: 850, stock: 145, category: 'Literatura' },
  { id: 'P-002', isbn: '978-0156012195', title: 'El principito', author: 'Antoine de Saint-Exupéry', price: 450, stock: 89, category: 'Infantil' },
  { id: 'P-003', isbn: '978-0451524935', title: '1984', author: 'George Orwell', price: 320, stock: 3, category: 'Literatura' },
  { id: 'P-005', isbn: '978-8498384453', title: 'Harry Potter y la piedra filosofal', author: 'J.K. Rowling', price: 680, stock: 67, category: 'Infantil' },
  { id: 'P-007', isbn: '978-8497592432', title: 'La sombra del viento', author: 'Carlos Ruiz Zafón', price: 520, stock: 42, category: 'Literatura' },
  { id: 'P-008', isbn: '978-8497592463', title: 'Dune', author: 'Frank Herbert', price: 480, stock: 28, category: 'Literatura' },
]

export const posClientTypes = [
  { value: 'general', label: 'Cliente General' },
  { value: 'institucional', label: 'Cliente Institucional' },
  { value: 'ocasional', label: 'Cliente Ocasional' },
] as const

export const salesHistory = [
  {
    id: 'FAC-2026-1842',
    date: '2026-06-20 14:32',
    customer: 'Cliente General',
    branch: 'Sucursal Centro',
    total: 1850,
    status: 'paid' as const,
    cashier: 'Luis Hernández',
    paymentMethod: 'Efectivo',
    items: [
      { productId: 'P-001', code: 'P-001', title: 'Cien años de soledad', qty: 1, unitPrice: 850 },
      { productId: 'P-005', code: 'P-005', title: 'Harry Potter y la piedra filosofal', qty: 1, unitPrice: 680 },
      { productId: 'P-003', code: 'P-003', title: '1984', qty: 1, unitPrice: 320 },
    ],
  },
  {
    id: 'FAC-2026-1841',
    date: '2026-06-20 13:15',
    customer: 'Cliente General',
    branch: 'Sucursal Polanco',
    total: 680,
    status: 'paid' as const,
    cashier: 'María González',
    paymentMethod: 'Tarjeta',
    items: [{ productId: 'P-005', code: 'P-005', title: 'Harry Potter y la piedra filosofal', qty: 1, unitPrice: 680 }],
  },
  {
    id: 'FAC-2026-1840',
    date: '2026-06-20 11:48',
    customer: 'Cliente Institucional',
    branch: 'Almacén Central',
    total: 12220,
    status: 'paid' as const,
    cashier: 'Carlos Ruiz',
    paymentMethod: 'Transferencia',
    items: [
      { productId: 'P-001', code: 'P-001', title: 'Cien años de soledad', qty: 10, unitPrice: 850 },
      { productId: 'P-005', code: 'P-005', title: 'Harry Potter y la piedra filosofal', qty: 5, unitPrice: 680 },
      { productId: 'P-003', code: 'P-003', title: '1984', qty: 5, unitPrice: 320 },
    ],
  },
  {
    id: 'FAC-2026-1839',
    date: '2026-06-19 17:22',
    customer: 'Cliente Ocasional',
    branch: 'Sucursal Guadalajara',
    total: 960,
    status: 'paid' as const,
    cashier: 'Ana Martínez',
    paymentMethod: 'Efectivo',
    items: [{ productId: 'P-003', code: 'P-003', title: '1984', qty: 3, unitPrice: 320 }],
  },
  {
    id: 'FAC-2026-1838',
    date: '2026-06-19 16:05',
    customer: 'Cliente General',
    branch: 'Sucursal Centro',
    total: 450,
    status: 'paid' as const,
    cashier: 'Luis Hernández',
    paymentMethod: 'Efectivo',
    items: [{ productId: 'P-002', code: 'P-002', title: 'El principito', qty: 1, unitPrice: 450 }],
  },
  {
    id: 'FAC-2026-1837',
    date: '2026-06-19 10:30',
    customer: 'Cliente general',
    branch: 'Sucursal Monterrey',
    total: 1320,
    status: 'cancelled' as const,
    cashier: 'Roberto Sánchez',
    paymentMethod: 'Efectivo',
    items: [
      { productId: 'P-005', code: 'P-005', title: 'Harry Potter y la piedra filosofal', qty: 1, unitPrice: 680 },
      { productId: 'P-003', code: 'P-003', title: '1984', qty: 2, unitPrice: 320 },
    ],
  },
]

/** Notas de crédito emitidas por cambios de producto (mock — preparado para integración con Inventario/Reportes/Auditoría) */
export const creditNotesSeed = [
  {
    id: 'NC-2026-001',
    invoiceId: 'FAC-2026-1838',
    exchangeId: 'CAM-2026-001',
    date: '2026-06-19 17:30',
    reason: 'Cambio por preferencia',
    amount: 130,
    status: 'active' as const,
  },
  {
    id: 'NC-2026-002',
    invoiceId: 'FAC-2026-1842',
    exchangeId: 'CAM-2026-002',
    date: '2026-06-18 11:00',
    reason: 'Producto defectuoso',
    amount: 170,
    status: 'used' as const,
  },
  {
    id: 'NC-2026-003',
    invoiceId: 'FAC-2026-1841',
    exchangeId: 'CAM-2026-003',
    date: '2026-05-30 09:15',
    reason: 'Error de venta',
    amount: 200,
    status: 'expired' as const,
  },
]

/** Historial de cambios de productos (mock) */
export const productExchangesSeed = [
  {
    id: 'CAM-2026-001',
    invoiceId: 'FAC-2026-1838',
    originalProductId: 'P-002',
    originalProductTitle: 'El principito',
    newProductId: 'P-003',
    newProductTitle: '1984',
    qty: 1,
    reason: 'Cambio por preferencia',
    priceDifference: -130,
    creditNoteId: 'NC-2026-001',
    user: 'Luis Hernández',
    date: '2026-06-19 17:30',
  },
  {
    id: 'CAM-2026-002',
    invoiceId: 'FAC-2026-1842',
    originalProductId: 'P-001',
    originalProductTitle: 'Cien años de soledad',
    newProductId: 'P-005',
    newProductTitle: 'Harry Potter y la piedra filosofal',
    qty: 1,
    reason: 'Producto defectuoso',
    priceDifference: -170,
    creditNoteId: 'NC-2026-002',
    user: 'Luis Hernández',
    date: '2026-06-18 11:00',
  },
  {
    id: 'CAM-2026-003',
    invoiceId: 'FAC-2026-1841',
    originalProductId: 'P-005',
    originalProductTitle: 'Harry Potter y la piedra filosofal',
    newProductId: 'P-002',
    newProductTitle: 'El principito',
    qty: 1,
    reason: 'Error de venta',
    priceDifference: -230,
    creditNoteId: 'NC-2026-003',
    user: 'María González',
    date: '2026-05-30 09:15',
  },
]
