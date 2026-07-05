export const auditActivities = [
  { id: 'AUD-001', timestamp: '2026-06-20 14:32:15', user: 'admin@joselito.com', action: 'Creó orden de compra OC-2026-089', module: 'Compras', type: 'create' as const },
  { id: 'AUD-002', timestamp: '2026-06-20 13:45:00', user: 'ventas@joselito.com', action: 'Registró venta FAC-2026-1842', module: 'Ventas', type: 'create' as const },
  { id: 'AUD-003', timestamp: '2026-06-20 11:20:33', user: 'inventario@joselito.com', action: 'Ajustó stock producto P-003', module: 'Inventario', type: 'update' as const },
  { id: 'AUD-004', timestamp: '2026-06-19 16:55:12', user: 'admin@joselito.com', action: 'Renovó contrato editorial ED-03', module: 'Editoriales', type: 'update' as const },
  { id: 'AUD-005', timestamp: '2026-06-19 09:10:00', user: 'sistema', action: 'Eliminó producto duplicado P-099', module: 'Administración', type: 'delete' as const },
]

export const auditChanges = [
  { id: 'CHG-001', timestamp: '2026-06-20 11:20:33', user: 'inventario@joselito.com', entity: 'Producto P-003', field: 'stock', oldValue: '5', newValue: '3', module: 'Inventario' },
  { id: 'CHG-002', timestamp: '2026-06-19 16:55:12', user: 'admin@joselito.com', entity: 'Editorial Alfaguara', field: 'contractExpiry', oldValue: '2026-06-21', newValue: '2027-06-21', module: 'Editoriales' },
  { id: 'CHG-003', timestamp: '2026-06-18 14:30:00', user: 'admin@joselito.com', entity: 'Tasa USD/DOP', field: 'rate', oldValue: '58.50', newValue: '58.75', module: 'Administración' },
]

export const auditAccess = [
  { id: 'ACC-001', timestamp: '2026-06-20 08:00:12', user: 'admin@joselito.com', action: 'Inicio de sesión', ip: '192.168.1.10', device: 'Chrome / Windows', status: 'success' as const },
  { id: 'ACC-002', timestamp: '2026-06-20 07:55:33', user: 'desconocido', action: 'Intento de acceso', ip: '45.33.12.89', device: 'Firefox / Linux', status: 'failed' as const },
  { id: 'ACC-003', timestamp: '2026-06-19 17:30:00', user: 'ventas@joselito.com', action: 'Cierre de sesión', ip: '192.168.1.25', device: 'Chrome / Windows', status: 'success' as const },
  { id: 'ACC-004', timestamp: '2026-06-19 09:15:22', user: 'inventario@joselito.com', action: 'Inicio de sesión', ip: '192.168.1.15', device: 'Safari / macOS', status: 'success' as const },
]

export const auditDeletions = [
  { id: 'DEL-001', timestamp: '2026-06-19 09:10:00', user: 'admin@joselito.com', entity: 'Producto P-099', module: 'Administración', reason: 'Producto duplicado' },
  { id: 'DEL-002', timestamp: '2026-06-15 11:45:00', user: 'admin@joselito.com', entity: 'Cliente CL-008', module: 'Ventas', reason: 'Solicitud del cliente' },
]
