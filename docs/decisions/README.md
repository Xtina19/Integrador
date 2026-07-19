# Decisiones de arquitectura vigentes

| ID | Decisión | Estado |
|----|----------|--------|
| ADR-01 | Inventory Engine es el único mutador de stock | Vigente |
| ADR-02 | Ventas monta con Engine compartido; sin stub local | Vigente |
| ADR-03 | Venta = Factura (un solo agregado) | Vigente |
| ADR-04 | NC solo se emite desde expediente de factura | Vigente |
| ADR-05 | Menú Ventas incluye listado NC solo consulta | Vigente |
| ADR-06 | Pagos sin campo `referencia`; NC vía `notaCreditoId` | Vigente |
| ADR-07 | Cambios absorben devolución física; no hay menú Devoluciones | Vigente |
| ADR-08 | Maestro de clientes en Administración | Vigente |
| ADR-09 | Packs MySQL definitivos para Inventario y Ventas | Vigente |
| ADR-10 | Compras no documentado ni cerrado en `/docs` oficial | Vigente |

Decisiones descartadas (no documentar como actuales): módulo NC de emisión independiente, pagos con referencia libre, Devoluciones como menú, sync de clientes `/clientes/sincronizar`.
