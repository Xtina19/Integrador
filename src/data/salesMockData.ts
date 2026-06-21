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
  { id: 'FAC-2026-1842', date: '2026-06-20 14:32', customer: 'Cliente General', branch: 'Sucursal Centro', total: 1850, status: 'paid' as const },
  { id: 'FAC-2026-1841', date: '2026-06-20 13:15', customer: 'Cliente General', branch: 'Sucursal Polanco', total: 680, status: 'paid' as const },
  { id: 'FAC-2026-1840', date: '2026-06-20 11:48', customer: 'Cliente Institucional', branch: 'Almacén Central', total: 12400, status: 'paid' as const },
  { id: 'FAC-2026-1839', date: '2026-06-19 17:22', customer: 'Cliente Ocasional', branch: 'Sucursal Guadalajara', total: 960, status: 'paid' as const },
  { id: 'FAC-2026-1838', date: '2026-06-19 16:05', customer: 'Cliente General', branch: 'Sucursal Centro', total: 450, status: 'paid' as const },
  { id: 'FAC-2026-1837', date: '2026-06-19 10:30', customer: 'Cliente general', branch: 'Sucursal Monterrey', total: 1320, status: 'cancelled' as const },
]

export const returns = [
  { id: 'DEV-001', invoice: 'FAC-2026-1820', product: '1984', reason: 'Producto dañado', date: '2026-06-18', status: 'approved' as const },
  { id: 'DEV-002', invoice: 'FAC-2026-1815', product: 'El principito', reason: 'Error en pedido', date: '2026-06-17', status: 'pending' as const },
  { id: 'DEV-003', invoice: 'FAC-2026-1808', product: 'Dune', reason: 'Cliente insatisfecho', date: '2026-06-15', status: 'rejected' as const },
]
