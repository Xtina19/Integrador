# Flujo — Nota de Crédito (emisión y aplicación)

## Objetivo

Emitir NC desde factura y aplicarla en una venta posterior.

---

## Emisión

```mermaid
flowchart TD
  A[Facturas] --> B[Abrir factura]
  B --> C[Tab Notas de Crédito]
  C --> D[Emitir]
  D --> E[POST /:id/notas-credito]
  E --> F[NC en expediente]
  E --> G[Aparece en /ventas/notas-credito]
```

**No** se emite desde el listado administrativo.

---

## Aplicación en POS

```mermaid
sequenceDiagram
  participant POS
  participant API
  participant Origen as Factura origen NC

  POS->>API: GET /notas-credito/disponibles?clienteId=
  POS->>POS: Usuario selecciona NC en selector
  POS->>API: Emitir venta con pago nota_credito + notaCreditoId
  API->>Origen: aplicarNcEnOrigen
  Note over API: Sin movimiento de stock
```

---

## Estados NC

emitida → parcialmente_aplicada → aplicada (o anulada sin aplicaciones).

---

## Notas

Anular: `POST /:id/notas-credito/:ncId/anular` solo si saldo completo sin aplicaciones.
