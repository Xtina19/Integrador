# API — Ventas

**Base:** `/api/v1/ventas`  
**Router:** `backend/src/modules/ventas/infrastructure/api/http/routes/ventasRoutes.ts`  
**Auth:** `x-user-id` + permiso por acción

---

## Emisión

| Método | Ruta | Permiso | Notas |
|--------|------|---------|-------|
| POST | `/` | emitir | Emisión |
| POST | `/pago` | emitir | Exactamente 1 pago |
| POST | `/pago-mixto` | emitir | ≥ 2 pagos |

Body pagos: `{ formaPago, monto, notaCreditoId?, montoEntregadoEfectivo? }` — **sin** `referencia`.

---

## Consulta

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/` | consultar |
| GET | `/por-numero/:numero` | consultar |
| GET | `/:id` | consultar |
| GET | `/:id/historial` | consultar |
| GET | `/:id/inventario` | consultar |
| GET | `/clientes/buscar` | buscar_cliente |

---

## Notas de crédito

| Método | Ruta | Permiso | Rol |
|--------|------|---------|-----|
| GET | `/notas-credito` | consultar | Listado admin |
| GET | `/notas-credito/disponibles` | nota_credito | POS |
| POST | `/:id/notas-credito` | nota_credito | **Emisión** |
| POST | `/:id/notas-credito/:ncId/anular` | nota_credito | |
| POST | `/:id/notas-credito/:ncId/revertir-aplicaciones` | nota_credito | |

---

## Postventa / anulación

| Método | Ruta | Permiso |
|--------|------|---------|
| POST | `/:id/cambios` | cambio |
| POST | `/:id/reimprimir` | reimprimir |
| POST | `/:id/anular` | anular |
| POST | `/:id/cancelar` | anular | Alias |

Orden de rutas: paths estáticos (`/notas-credito`, `/pago`, …) **antes** de `/:id`.
