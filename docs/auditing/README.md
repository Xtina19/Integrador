# Auditoría y trazabilidad

**Objetivo:** Dónde queda registrado lo que ocurre en Inventario y Ventas.

---

## Inventario

| Mecanismo | Ubicación |
|-----------|-----------|
| Ledger de stock | `movimiento_inventario` (saldo ant/post, documento, usuario, idempotency) |
| Bitácora conteo | `auditoria_conteo_fisico` |
| Auditoría de módulo | tablas/outbox del pack INV |
| UI | pantallas de detalle + kardex |

---

## Ventas

| Mecanismo | Ubicación |
|-----------|-----------|
| Historial de factura | `historial_ventas` + colección en agregado |
| Aplicaciones NC | `nota_credito_aplicaciones` |
| Pagos con NC | `pagos.nota_credito_id` |
| UI | tab Historial unificado del expediente; listado NC (aplicaciones) |

Eventos típicos: emisión, pago, cambio, nota_credito, aplicacion_nc, anulación, reimpresión.

---

## Qué no se audita como “stock”

Operaciones solo comerciales de NC no generan movimiento de inventario; quedan en historial comercial.
