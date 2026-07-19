# Documentación oficial — Módulo Ventas

**Estado:** implementado y operativo  
**Código:** `backend/src/modules/ventas/`, `Frontend/src/modules/ventas/`  
**API base:** `/api/v1/ventas`  
**BD:** `database/mysql/ventas_definitivo/`

---

## Objetivo

Registrar y gestionar el ciclo comercial de la librería: emisión de facturas (POS), consulta de facturas, postventa (cambios), notas de crédito derivadas de factura, y consulta administrativa de NC.

---

## Menú actual (UI)

```
Ventas
├── Dashboard
├── POS
├── Facturas
└── Notas de Crédito   ← solo consulta / administración documental
```

Rutas FE: `/ventas`, `/ventas/pos`, `/ventas/facturas`, `/ventas/facturas/:id`, `/ventas/notas-credito`.

---

## Índice

| Documento | Contenido |
|-----------|-----------|
| [architecture.md](./architecture.md) | Capas DDD, composición, permisos |
| [domain.md](./domain.md) | Venta=Factura, pagos, cambios, NC |
| [flows.md](./flows.md) | Emisión, NC, aplicación, postventa |
| [pos-and-payments.md](./pos-and-payments.md) | POS, formas de pago, pago mixto |
| [credit-notes.md](./credit-notes.md) | Emisión desde factura + listado consulta |
| [integration-inventory.md](./integration-inventory.md) | Vínculo con Inventory Engine |
| [screens.md](./screens.md) | Pantallas y breadcrumbs |

API resumida: [../api/sales.md](../api/sales.md)  
BD: [../database/sales.md](../database/sales.md)  
Reglas: [../business-rules/sales.md](../business-rules/sales.md)

---

## Relación Venta ↔ Factura

En dominio e implementación, **una Venta emitida ES la factura**.  
Aggregate Root: `Venta` (`numeroFactura`, estado `emitida` | `anulada`).

No existe un documento “factura” separado de `Venta`.

---

## Relación Factura ↔ Nota de Crédito

- Toda NC **nace** desde el expediente de una factura (`POST /:id/notas-credito`).  
- El listado `/ventas/notas-credito` **no emite**.  
- La NC siempre referencia `ventaOrigenId` (factura padre).  
- Aplicación en una venta nueva: pago `formaPago: nota_credito` + `notaCreditoId`.

---

## Qué no hace Ventas

- No mantiene el maestro de clientes (Administración).  
- No muta stock directamente: solicita al Inventory Engine.  
- No tiene campo `referencia` en pagos (eliminado).  
- No tiene menú de emisión de NC independiente.
