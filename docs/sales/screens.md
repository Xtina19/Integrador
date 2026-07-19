# Ventas — Pantallas

**Objetivo:** Mapa UI implementado.

| Ruta | Pantalla | Notas |
|------|----------|-------|
| `/ventas` | Dashboard comercial | Indicadores |
| `/ventas/pos` | Punto de Venta | Emisión + pagos + selector NC |
| `/ventas/facturas` | Listado de facturas | Buscar / filtrar / abrir |
| `/ventas/facturas/:id` | Expediente | Tabs: general, productos, pagos, historial, cambios, NC, inventario |
| `/ventas/notas-credito` | Listado NC | Solo consulta |
| `/ventas/historial` | Legacy | Ruta residual |
| `/ventas/cambios-notas` | Redirect | → `/ventas/notas-credito` |

Breadcrumbs expediente: Ventas → Facturas → número factura.

Desde tab NC del expediente: enlace al listado administrativo.
