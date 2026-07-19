# Ventas — Modelo de dominio

**Objetivo:** Entidades y estados implementados en código.

**Código:** `backend/src/modules/ventas/domain/`

---

## Aggregate Root: `Venta` (factura)

| Campo conceptual | Detalle |
|------------------|---------|
| id | dominio UUID |
| numeroFactura | único |
| estado | `emitida` \| `anulada` |
| tipoVenta | `consumidor_final` \| `cliente_registrado` |
| clienteId | obligatorio si cliente registrado |
| sucursalId, almacenId | origen de stock |
| lineas | productos + descuentos |
| pagos | uno o más |
| cambios | postventa mercancía |
| notasCredito | NC emitidas **desde esta** factura |
| historial | bitácora de eventos |
| version | concurrencia optimista |

---

## `Pago`

| Campo | Uso |
|-------|-----|
| formaPago | `efectivo` \| `tarjeta` \| `transferencia` \| `nota_credito` |
| monto | > 0, entero DOP |
| notaCreditoId | **obligatorio** si `nota_credito` |
| vuelto | solo efectivo con monto entregado |

**No existe** campo `referencia` en pagos (eliminado del dominio, API y BD).

---

## `NotaCredito`

Estados (dominio → etiqueta UI):

| Dominio | UI |
|---------|-----|
| `emitida` | Disponible |
| `parcialmente_aplicada` | Parcialmente utilizada |
| `aplicada` | Utilizada |
| `anulada` | Anulada |

Reglas clave:

- Anular solo si no hay aplicaciones (`montoAplicado = 0`).  
- Aplicar reduce saldo y registra en `aplicaciones[]`.  
- Siempre ligada a `ventaOrigenId`.

---

## `Cambio`

Única vía de postventa de mercancía (incluye devolución física sin producto de salida: `lineasNuevas: []`).

Resoluciones: cobro diferencia, devolución dinero, emisión NC por diferencia, sin diferencia, etc.

---

## Historial

Eventos tipados (`emision`, `pago`, `cambio`, `nota_credito`, `aplicacion_nc`, `anulacion`, `reimpresion`, …) en el agregado y tabla `historial_ventas`.
