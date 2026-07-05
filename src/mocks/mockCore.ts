export const branches = [
  { id: 'central', name: 'Almacén Central', city: 'Ciudad de México', stock: 12450 },
  { id: 'suc-1', name: 'Sucursal Centro', city: 'CDMX Centro', stock: 3240 },
  { id: 'suc-2', name: 'Sucursal Polanco', city: 'CDMX Polanco', stock: 2890 },
  { id: 'suc-3', name: 'Sucursal Coyoacán', city: 'CDMX Coyoacán', stock: 2150 },
  { id: 'suc-4', name: 'Sucursal Guadalajara', city: 'Guadalajara', stock: 1980 },
  { id: 'suc-5', name: 'Sucursal Monterrey', city: 'Monterrey', stock: 1760 },
]

export const inventoryChartData = [
  { month: 'Ene', central: 11200, sucursales: 9800 },
  { month: 'Feb', central: 11800, sucursales: 10200 },
  { month: 'Mar', central: 12100, sucursales: 10800 },
  { month: 'Abr', central: 11900, sucursales: 11200 },
  { month: 'May', central: 12450, sucursales: 12020 },
  { month: 'Jun', central: 12450, sucursales: 12020 },
]

export const stockByCategory = [
  { name: 'Literatura', value: 4200, color: '#1E2D86' },
  { name: 'Infantil', value: 2800, color: '#F4D22E' },
  { name: 'Académico', value: 3100, color: '#2a3da0' },
  { name: 'Cómics', value: 1500, color: '#d4b520' },
  { name: 'Otros', value: 870, color: '#6b7280' },
]

export const lowStockProducts = [
  { id: 'P-001', title: 'Cien años de soledad', isbn: '978-0307474728', stock: 3, minStock: 15, branch: 'Sucursal Centro' },
  { id: 'P-002', title: 'El principito', isbn: '978-0156012195', stock: 5, minStock: 20, branch: 'Sucursal Polanco' },
  { id: 'P-003', title: '1984', isbn: '978-0451524935', stock: 2, minStock: 10, branch: 'Almacén Central' },
  { id: 'P-004', title: 'Don Quijote de la Mancha', isbn: '978-8491050675', stock: 4, minStock: 12, branch: 'Sucursal Coyoacán' },
  { id: 'P-005', title: 'Harry Potter y la piedra filosofal', isbn: '978-8498384453', stock: 6, minStock: 25, branch: 'Sucursal Guadalajara' },
]

export const recentSales = [
  { id: 'V-1042', product: 'Sapiens', branch: 'Sucursal Polanco', qty: 2, total: 598, date: '2026-06-06 10:32' },
  { id: 'V-1041', product: 'El arte de la guerra', branch: 'Sucursal Centro', qty: 1, total: 189, date: '2026-06-06 10:15' },
  { id: 'V-1040', product: 'Crónica de una muerte anunciada', branch: 'Sucursal Coyoacán', qty: 3, total: 447, date: '2026-06-06 09:48' },
  { id: 'V-1039', product: 'Dune', branch: 'Sucursal Monterrey', qty: 1, total: 349, date: '2026-06-06 09:22' },
  { id: 'V-1038', product: 'La sombra del viento', branch: 'Sucursal Guadalajara', qty: 2, total: 520, date: '2026-06-05 18:45' },
]

export const logisticsAlerts = [
  { id: 1, type: 'warning', message: 'Transferencia TR-089 pendiente de recepción en Sucursal Monterrey', time: 'Hace 2 horas' },
  { id: 2, type: 'danger', message: 'Stock crítico: 5 productos bajo mínimo en Sucursal Centro', time: 'Hace 3 horas' },
  { id: 3, type: 'info', message: 'Envío de transporte propio #TP-234 en ruta a Guadalajara', time: 'Hace 5 horas' },
  { id: 4, type: 'warning', message: 'Contrato con Editorial Planeta vence en 15 días', time: 'Hace 1 día' },
]

export const products = [
  { id: 'P-001', isbn: '978-0307474728', title: 'Cien años de soledad', author: 'Gabriel García Márquez', category: 'Literatura', publisher: 'Editorial Sudamericana', stock: 145, location: 'Almacén Central - A-12', status: 'normal' },
  { id: 'P-002', isbn: '978-0156012195', title: 'El principito', author: 'Antoine de Saint-Exupéry', category: 'Infantil', publisher: 'Salamandra', stock: 89, location: 'Sucursal Polanco - B-03', status: 'normal' },
  { id: 'P-003', isbn: '978-0451524935', title: '1984', author: 'George Orwell', category: 'Literatura', publisher: 'Debolsillo', stock: 3, location: 'Sucursal Centro - C-07', status: 'low' },
  { id: 'P-004', isbn: '978-8491050675', title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', category: 'Literatura', publisher: 'Real Academia Española', stock: 67, location: 'Almacén Central - A-05', status: 'normal' },
  { id: 'P-005', isbn: '978-8498384453', title: 'Harry Potter y la piedra filosofal', author: 'J.K. Rowling', category: 'Infantil', publisher: 'Salamandra', stock: 234, location: 'Sucursal Coyoacán - D-01', status: 'normal' },
  { id: 'P-006', isbn: '978-6073159015', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Académico', publisher: 'Debate', stock: 56, location: 'Sucursal Polanco - A-08', status: 'normal' },
  { id: 'P-007', isbn: '978-8497592432', title: 'La sombra del viento', author: 'Carlos Ruiz Zafón', category: 'Literatura', publisher: 'Planeta', stock: 0, location: 'Sucursal Guadalajara - B-12', status: 'out' },
  { id: 'P-008', isbn: '978-8497592463', title: 'Dune', author: 'Frank Herbert', category: 'Literatura', publisher: 'Debolsillo', stock: 42, location: 'Almacén Central - C-15', status: 'normal' },
]

export const categories = ['Literatura', 'Infantil', 'Académico', 'Cómics', 'Otros']

export const transfers = [
  { id: 'TR-092', origin: 'Almacén Central', destination: 'Sucursal Monterrey', product: 'Sapiens', qty: 50, status: 'in_transit', date: '2026-06-05', transport: 'Transporte Propio #TP-234' },
  { id: 'TR-091', origin: 'Sucursal Centro', destination: 'Sucursal Polanco', product: 'El principito', qty: 20, status: 'completed', date: '2026-06-04', transport: 'Interno' },
  { id: 'TR-090', origin: 'Almacén Central', destination: 'Sucursal Guadalajara', product: 'Harry Potter y la piedra filosofal', qty: 100, status: 'pending', date: '2026-06-06', transport: 'Transporte Propio #TP-235' },
  { id: 'TR-089', origin: 'Sucursal Coyoacán', destination: 'Sucursal Monterrey', product: '1984', qty: 15, status: 'pending_receipt', date: '2026-06-03', transport: 'Interno' },
  { id: 'TR-088', origin: 'Almacén Central', destination: 'Sucursal Centro', product: 'Don Quijote de la Mancha', qty: 30, status: 'completed', date: '2026-06-02', transport: 'Transporte Propio #TP-232' },
]

export const transferHistory = [
  { id: 'TR-087', origin: 'Sucursal Polanco', destination: 'Almacén Central', product: 'Dune', qty: 25, status: 'completed', date: '2026-06-01' },
  { id: 'TR-086', origin: 'Almacén Central', destination: 'Sucursal Coyoacán', product: 'La sombra del viento', qty: 40, status: 'completed', date: '2026-05-30' },
  { id: 'TR-085', origin: 'Sucursal Guadalajara', destination: 'Sucursal Centro', product: 'Cien años de soledad', qty: 10, status: 'completed', date: '2026-05-28' },
]

export const events = [
  { id: 'EV-01', name: 'Feria Internacional del Libro CDMX', type: 'feria', startDate: '2026-06-15', endDate: '2026-06-25', location: 'Centro Citibanamex', publisher: 'Planeta', budget: 250000, responsible: 'Laura Méndez', status: 'upcoming', participants: 12, reservations: 450 },
  { id: 'EV-02', name: 'Presentación: Nuevo catálogo infantil', type: 'evento', startDate: '2026-06-10', endDate: '2026-06-10', location: 'Sucursal Coyoacán', publisher: 'Salamandra', budget: 12000, responsible: 'Ana Martínez', status: 'active', participants: 5, reservations: 80 },
  { id: 'EV-03', name: 'Feria del Libro Guadalajara', type: 'feria', startDate: '2026-11-28', endDate: '2026-12-06', location: 'Expo Guadalajara', publisher: 'Debate', budget: 180000, responsible: 'Carlos Ruiz', status: 'planned', participants: 8, reservations: 0 },
  { id: 'EV-04', name: 'Club de lectura mensual', type: 'evento', startDate: '2026-06-20', endDate: '2026-06-20', location: 'Sucursal Polanco', publisher: 'Debolsillo', budget: 8000, responsible: 'Luis Hernández', status: 'upcoming', participants: 3, reservations: 35 },
]

export const calendarEvents = [
  { day: 10, event: 'Presentación infantil', type: 'evento' },
  { day: 15, event: 'Feria CDMX inicio', type: 'feria' },
  { day: 20, event: 'Club de lectura', type: 'evento' },
  { day: 25, event: 'Feria CDMX cierre', type: 'feria' },
]

export const roles = [
  { id: 'admin', name: 'Administrador', users: 3, permissions: ['all'] },
  { id: 'manager', name: 'Gerente de Sucursal', users: 5, permissions: ['inventory', 'sales', 'transfers', 'reports'] },
  { id: 'logistics', name: 'Logística', users: 4, permissions: ['inventory', 'transfers', 'transport'] },
  { id: 'sales', name: 'Vendedor', users: 18, permissions: ['sales', 'inventory_view'] },
  { id: 'viewer', name: 'Consulta', users: 2, permissions: ['inventory_view', 'reports_view'] },
]

export const auditLog = [
  { id: 1, user: 'María González', action: 'Creó transferencia TR-090', module: 'Transferencias', timestamp: '2026-06-06 08:45', ip: '192.168.1.45' },
  { id: 2, user: 'Carlos Ruiz', action: 'Actualizó stock producto P-003', module: 'Inventario', timestamp: '2026-06-06 08:30', ip: '192.168.1.22' },
  { id: 3, user: 'Ana Martínez', action: 'Aprobó contrato ED-03', module: 'Editoriales', timestamp: '2026-06-05 16:20', ip: '192.168.1.10' },
  { id: 4, user: 'Luis Hernández', action: 'Registró venta V-1042', module: 'Ventas', timestamp: '2026-06-06 10:32', ip: '192.168.2.15' },
  { id: 5, user: 'Sistema', action: 'Alerta automática: stock bajo P-003', module: 'Sistema', timestamp: '2026-06-06 06:00', ip: '—' },
]

export const permissions = [
  { module: 'Inventario', view: true, create: true, edit: true, delete: false },
  { module: 'Transferencias', view: true, create: true, edit: true, delete: false },
  { module: 'Editoriales', view: true, create: true, edit: true, delete: false },
  { module: 'Eventos', view: true, create: true, edit: true, delete: true },
  { module: 'Usuarios', view: true, create: false, edit: false, delete: false },
  { module: 'Reportes', view: true, create: false, edit: false, delete: false },
]
