# Reglas de negocio — Ventas

| ID | Regla |
|----|--------|
| VEN-01 | Menú: Dashboard · POS · Facturas · Notas de Crédito (consulta). |
| VEN-02 | `Venta` = factura; estados `emitida` \| `anulada`. |
| VEN-03 | Emisión de NC **solo** desde expediente de factura. |
| VEN-04 | Listado NC: consulta; **nunca** origen de emisión. |
| VEN-05 | NC siempre tiene factura origen. |
| VEN-06 | Estados NC: emitida / parcialmente_aplicada / aplicada / anulada. |
| VEN-07 | Anular NC solo sin aplicaciones. |
| VEN-08 | Formas de pago: efectivo, tarjeta, transferencia, nota_credito. |
| VEN-09 | Pago NC exige `notaCreditoId`; **no** existe campo referencia. |
| VEN-10 | Pago mixto: ≥ 2 formas; suma = total. |
| VEN-11 | Cambio es la única vía de postventa de mercancía (incluye solo-devolución). |
| VEN-12 | No hay menú/flujo independiente Devoluciones. |
| VEN-13 | Anulación de factura restringida por permiso y auditada. |
| VEN-14 | Stock solo vía Engine (emisión, anulación, cambios). |
| VEN-15 | Cliente registrado obligatorio para NC y postventa con crédito. |
