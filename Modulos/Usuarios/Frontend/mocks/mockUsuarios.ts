export const activeSessions = [
  { id: 'SES-001', user: 'admin@joselito.com', name: 'María González', device: 'Chrome / Windows', ip: '192.168.1.10', started: '2026-06-20 08:00', lastActivity: '2026-06-20 14:32' },
  { id: 'SES-002', user: 'ventas@joselito.com', name: 'Carlos Rodríguez', device: 'Chrome / Windows', ip: '192.168.1.25', started: '2026-06-20 09:15', lastActivity: '2026-06-20 14:28' },
  { id: 'SES-003', user: 'inventario@joselito.com', name: 'Ana Martínez', device: 'Safari / macOS', ip: '192.168.1.15', started: '2026-06-20 07:30', lastActivity: '2026-06-20 13:45' },
]

export const accessHistory = [
  { id: 'AH-001', user: 'admin@joselito.com', action: 'Inicio de sesión', ip: '192.168.1.10', device: 'Chrome / Windows', timestamp: '2026-06-20 08:00:12', status: 'success' as const },
  { id: 'AH-002', user: 'desconocido', action: 'Intento de acceso', ip: '45.33.12.89', device: 'Firefox / Linux', timestamp: '2026-06-20 07:55:33', status: 'failed' as const },
  { id: 'AH-003', user: 'ventas@joselito.com', action: 'Inicio de sesión', ip: '192.168.1.25', device: 'Chrome / Windows', timestamp: '2026-06-20 09:15:00', status: 'success' as const },
  { id: 'AH-004', user: 'inventario@joselito.com', action: 'Cierre de sesión', ip: '192.168.1.15', device: 'Safari / macOS', timestamp: '2026-06-19 17:30:00', status: 'success' as const },
]

export const failedAttempts = [
  { id: 'FA-001', username: 'admin', ip: '45.33.12.89', timestamp: '2026-06-20 07:55:33', reason: 'Contraseña incorrecta' },
  { id: 'FA-002', username: 'root', ip: '45.33.12.89', timestamp: '2026-06-20 07:55:28', reason: 'Usuario no existe' },
  { id: 'FA-003', username: 'ventas@joselito.com', ip: '192.168.1.99', timestamp: '2026-06-19 22:10:15', reason: 'Contraseña incorrecta' },
]

export const mfaSettings = [
  { user: 'admin@joselito.com', name: 'María González', mfaEnabled: true, method: 'App autenticador', lastVerified: '2026-06-20 08:00' },
  { user: 'ventas@joselito.com', name: 'Carlos Rodríguez', mfaEnabled: false, method: '—', lastVerified: '—' },
  { user: 'inventario@joselito.com', name: 'Ana Martínez', mfaEnabled: true, method: 'SMS', lastVerified: '2026-06-20 07:30' },
]
