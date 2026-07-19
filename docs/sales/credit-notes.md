# Ventas — Notas de Crédito

**Objetivo:** Emisión vs consulta administrativa.

---

## Emisión (única vía)

```
Ventas → Facturas → Abrir factura → Expediente → Notas de Crédito → Emitir
```

API: `POST /api/v1/ventas/:ventaId/notas-credito`

Requiere cliente registrado y reglas de saldo acreditable.

---

## Listado administrativo

Ruta UI: `/ventas/notas-credito`  
API: `GET /api/v1/ventas/notas-credito`

**Permite:** buscar, filtrar, consultar, reimprimir, ver aplicaciones, abrir factura origen, anular (si reglas lo permiten).

**No permite:** crear, emitir, NC manual, NC sin factura, cambiar cliente u origen.

Indicadores informativos (no dashboard comercial): emitidas, crédito disponible, aplicado, anuladas.

---

## Operaciones sobre NC existente

| Acción | Endpoint |
|--------|----------|
| Anular | `POST /:id/notas-credito/:ncId/anular` |
| Revertir aplicaciones | `POST /:id/notas-credito/:ncId/revertir-aplicaciones` |
| Disponibles por cliente (POS) | `GET /notas-credito/disponibles?clienteId=` |

Anulación: solo sin aplicaciones.

---

## Identificación en pagos

La NC aplicada a una venta se guarda en `pagos.nota_credito_id` (dominio_id), **nunca** como texto de referencia.
