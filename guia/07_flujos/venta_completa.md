# Flujo — Venta completa (facturación)

## Objetivo

Emitir una factura cobrada desde el POS.

---

## Descripción

1. Usuario abre **Ventas → POS**.  
2. Agrega productos; opcionalmente selecciona cliente registrado.  
3. Define pagos (una o más formas).  
4. Emite → backend crea `Venta`, aplica salida de stock vía Engine, persiste pagos/historial.  
5. Redirige al expediente de la factura.

---

## Diagrama

```mermaid
sequenceDiagram
  participant U as Cajero
  participant POS as POS UI
  participant API as /api/v1/ventas
  participant Eng as Inventory Engine
  participant DB as MySQL

  U->>POS: Líneas + pagos
  POS->>API: POST / o /pago o /pago-mixto
  API->>Eng: salida_venta
  Eng->>DB: inventario + movimiento
  API->>DB: ventas + lineas + pagos + historial
  API-->>POS: Factura emitida
  POS->>U: Expediente /ventas/facturas/:id
```

---

## Endpoints

`POST /api/v1/ventas`, `/pago`, `/pago-mixto`

---

## Notas

Si hay pago `nota_credito`, tras guardar se aplica saldo en la NC origen (`notaCreditoId`).
