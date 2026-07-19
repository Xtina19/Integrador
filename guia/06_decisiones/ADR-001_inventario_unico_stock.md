# ADR-001 — Inventario es el único responsable del stock

## Qué se decidió

Solo el **Inventory Engine** (módulo Inventario) puede mutar existencias. Ventas y cualquier otro módulo solicitan efectos vía puertos; no escriben tablas de stock.

## Por qué

Evitar saldos inconsistentes, doble escritura y reglas de stock duplicadas en cada módulo comercial.

## Problema que resolvió

Stubs locales de inventario en Ventas, proyecciones sintéticas y desalineación factura ↔ kardex.

## Impacto

- `createVentasComposition` exige composition Inventario.  
- Emisión / anulación / cambios pasan por `InventarioEfectosPort`.  
- NC no toca stock.
