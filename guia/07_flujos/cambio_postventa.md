# Flujo — Cambio / postventa

## Objetivo

Registrar cambio de mercancía sobre una factura existente (incluye solo devolución física).

---

## Descripción

1. Expediente de factura → tab **Cambios**.  
2. Asistente: líneas a devolver / entregar (o solo devolver).  
3. `POST /api/v1/ventas/:id/cambios`.  
4. Engine ajusta stock; opcional pago de diferencia o compensación NC.

No hay menú “Devoluciones”.

---

## Diagrama

```mermaid
flowchart TD
  F[Factura emitida] --> C[Asistente cambio]
  C --> API[POST /:id/cambios]
  API --> Eng[Engine entrada/salida]
  API --> P{¿Diferencia?}
  P -->|Cliente debe| Pay[Pago diferencia]
  P -->|Tienda debe| Comp[Dinero o NC]
  P -->|Cero| H[Solo historial + stock]
```

---

## Notas

Pagos de diferencia: forma + monto (sin Referencia).
