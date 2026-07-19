# Reglas de negocio — Inventario

Resumen de lo implementado en dominio + Engine. Detalle: [../inventory/03-reglas-negocio.md](../inventory/03-reglas-negocio.md)

| ID | Regla |
|----|--------|
| INV-01 | Stock no negativo; cantidades enteras. |
| INV-02 | Concurrencia optimista (`version`) en existencias y documentos. |
| INV-03 | Mutaciones Engine con `idempotencyKey`. |
| INV-04 | Todo movimiento exige actor (`usuarioId`) y documento origen. |
| INV-05 | Producto inactivo: sin movimientos. |
| INV-06 | Almacén bloqueado por conteo: sin movimientos ajenos al conteo dueño. |
| INV-07 | Transferencia: origen ≠ destino; despacho/recepción vía Engine. |
| INV-08 | Ajuste / descarte / conteo: máquinas de estado propias; aplicar = Engine. |
| INV-09 | Ledger único: `movimiento_inventario`. |
| INV-10 | Dinero de costo en DOP enteros (`DECIMAL(18,0)`). |
