export const configSections = [
  {
    id: 'general',
    title: 'Parámetros Generales',
    items: [
      { key: 'company_name', label: 'Nombre de la empresa', value: 'Librería Joselito S.A.', type: 'text' as const },
      { key: 'timezone', label: 'Zona horaria', value: 'America/Santo_Domingo', type: 'text' as const },
      { key: 'fiscal_year', label: 'Año fiscal', value: '2026', type: 'text' as const },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventario',
    items: [
      { key: 'min_stock', label: 'Stock mínimo global', value: '5', type: 'number' as const },
      { key: 'auto_reorder', label: 'Reorden automático', value: 'true', type: 'boolean' as const },
    ],
  },
  {
    id: 'taxes',
    title: 'Impuestos',
    items: [
      { key: 'itbis', label: 'ITBIS (%)', value: '18', type: 'number' as const },
      { key: 'tax_included', label: 'Precios con impuesto incluido', value: 'true', type: 'boolean' as const },
    ],
  },
  {
    id: 'currency',
    title: 'Moneda',
    items: [
      { key: 'default_currency', label: 'Moneda por defecto', value: 'DOP', type: 'text' as const },
      { key: 'secondary_currency', label: 'Moneda secundaria', value: 'USD', type: 'text' as const },
    ],
  },
  {
    id: 'numbering',
    title: 'Numeraciones',
    items: [
      { key: 'invoice_prefix', label: 'Prefijo facturas', value: 'FAC', type: 'text' as const },
      { key: 'order_prefix', label: 'Prefijo órdenes de compra', value: 'OC', type: 'text' as const },
      { key: 'transfer_prefix', label: 'Prefijo transferencias', value: 'TR', type: 'text' as const },
    ],
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    items: [
      { key: 'low_stock_alert', label: 'Alerta bajo stock', value: 'true', type: 'boolean' as const },
      { key: 'contract_expiry_days', label: 'Días aviso vencimiento contrato', value: '30', type: 'number' as const },
      { key: 'email_notifications', label: 'Notificaciones por correo', value: 'true', type: 'boolean' as const },
    ],
  },
]

export const notificationEmails = [
  { id: 'NE-001', event: 'Bajo stock', recipients: 'inventario@joselito.com', active: true },
  { id: 'NE-002', event: 'Contrato por vencer', recipients: 'admin@joselito.com', active: true },
  { id: 'NE-003', event: 'Recepción pendiente', recipients: 'compras@joselito.com', active: true },
  { id: 'NE-004', event: 'Embarque en aduana', recipients: 'importaciones@joselito.com', active: false },
]
