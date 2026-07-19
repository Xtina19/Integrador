# Ventas — POS y pagos

**Objetivo:** Formas de pago y UI de cobro actuales.

---

## Formas de pago implementadas

| Forma | Campos UI | Payload |
|-------|-----------|---------|
| Efectivo | Forma + Monto (+ efectivo entregado interno) | `formaPago`, `monto`, `montoEntregadoEfectivo?` |
| Tarjeta | Forma + Monto | `formaPago`, `monto` |
| Transferencia | Forma + Monto | `formaPago`, `monto` |
| Nota de Crédito | Forma + Monto + **selector de NC** + saldo | `formaPago`, `monto`, `notaCreditoId` |

### Eliminado

- Campo **Referencia** (UI, DTO, dominio, columna BD).  
- Ningún método de pago usa texto libre de referencia.

---

## Pago mixto

Varias líneas de pago cuya suma cubre el total.  
Ejemplo: NC parcial + efectivo restante.

Backend: `POST /api/v1/ventas/pago-mixto` (mínimo 2 pagos).

---

## Selector de Nota de Crédito

- Solo NC del cliente de la venta.  
- Estados disponibles: `emitida`, `parcialmente_aplicada` (saldo > 0).  
- No muestra anuladas ni totalmente aplicadas.  
- Al seleccionar: completa `notaCreditoId` y sugiere monto = min(saldo, restante).

---

## Layout UI pagos

```
[ Forma de pago ]  [ Monto ]
(+ si NC:)
[ Seleccionar Nota de Crédito ▼ ]
Saldo disponible RD$…
```
