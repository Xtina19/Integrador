export const kardexMovements = [
  { id: 'K-001', date: '2026-06-20 10:15', product: '1984', isbn: '978-0451524935', type: 'Salida', qty: -2, balance: 3, reference: 'FAC-2026-1842', user: 'ventas@joselito.com' },
  { id: 'K-002', date: '2026-06-19 16:30', product: 'Cien años de soledad', isbn: '978-0307474728', type: 'Entrada', qty: 50, balance: 145, reference: 'REC-2026-034', user: 'inventario@joselito.com' },
  { id: 'K-003', date: '2026-06-19 11:00', product: 'Harry Potter y la piedra filosofal', isbn: '978-8498384453', type: 'Transferencia', qty: -10, balance: 67, reference: 'TR-089', user: 'inventario@joselito.com' },
  { id: 'K-004', date: '2026-06-18 09:45', product: 'Dune', isbn: '978-8497592463', type: 'Ajuste', qty: -3, balance: 28, reference: 'AJ-2026-012', user: 'admin@joselito.com' },
]

export const locations = [
  { id: 'LOC-001', product: 'Cien años de soledad', isbn: '978-0307474728', warehouse: 'Almacén Central', aisle: 'A', shelf: '12', section: 'Literatura', qty: 85 },
  { id: 'LOC-002', product: 'El principito', isbn: '978-0156012195', warehouse: 'Sucursal Polanco', aisle: 'B', shelf: '03', section: 'Infantil', qty: 45 },
  { id: 'LOC-003', product: '1984', isbn: '978-0451524935', warehouse: 'Sucursal Centro', aisle: 'C', shelf: '07', section: 'Literatura', qty: 3 },
  { id: 'LOC-004', product: 'Dune', isbn: '978-8497592463', warehouse: 'Almacén Central', aisle: 'A', shelf: '18', section: 'Literatura', qty: 28 },
]

export const inventoryAdjustments = [
  { id: 'AJ-2026-012', date: '2026-06-18', product: 'Dune', type: 'Salida', qty: 3, reason: 'Daño en almacén', user: 'admin@joselito.com', status: 'approved' as const },
  { id: 'AJ-2026-011', date: '2026-06-15', product: 'El principito', type: 'Entrada', qty: 20, reason: 'Corrección de inventario', user: 'inventario@joselito.com', status: 'approved' as const },
  { id: 'AJ-2026-010', date: '2026-06-12', product: '1984', type: 'Salida', qty: 5, reason: 'Muestra promocional', user: 'ventas@joselito.com', status: 'pending' as const },
]

export const physicalCounts = [
  { id: 'CF-2026-006', date: '2026-06-15', warehouse: 'Almacén Central', products: 245, discrepancies: 3, status: 'completed' as const },
  { id: 'CF-2026-005', date: '2026-06-10', warehouse: 'Sucursal Centro', products: 89, discrepancies: 1, status: 'completed' as const },
  { id: 'CF-2026-007', date: '2026-06-20', warehouse: 'Sucursal Polanco', products: 112, discrepancies: 0, status: 'in_progress' as const },
]

export const transferRequests = [
  { id: 'SOL-089', origin: 'Almacén Central', destination: 'Sucursal Centro', product: 'Harry Potter y la piedra filosofal', qty: 10, date: '2026-06-19', status: 'pending' as const },
  { id: 'SOL-088', origin: 'Sucursal Polanco', destination: 'Sucursal Guadalajara', product: 'Dune', qty: 5, date: '2026-06-18', status: 'approved' as const },
]

export const transferApprovals = [
  { id: 'SOL-088', origin: 'Sucursal Polanco', destination: 'Sucursal Guadalajara', product: 'Dune', qty: 5, approvedBy: 'María González', date: '2026-06-18 14:00', status: 'approved' as const },
]

export const transferReceptions = [
  { id: 'TR-087', origin: 'Almacén Central', destination: 'Sucursal Monterrey', product: 'Sapiens', qty: 15, receivedBy: 'Carlos Rodríguez', date: '2026-06-17', status: 'received' as const },
]
