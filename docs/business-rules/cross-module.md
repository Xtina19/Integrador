# Reglas cruzadas (Inventario ↔ Ventas ↔ Administración)

| ID | Regla |
|----|--------|
| X-01 | **Inventario es el único responsable del stock.** Ningún otro módulo escribe existencias directamente. |
| X-02 | Los movimientos de inventario **siempre** provienen del **Inventory Engine**. |
| X-03 | Las facturas **nunca** modifican inventario directamente; solicitan efectos al Engine. |
| X-04 | Una **Venta emitida genera / es la Factura** (mismo agregado `Venta`). |
| X-05 | Una **Nota de Crédito siempre nace desde una Factura**. |
| X-06 | Emitir / anular / aplicar NC **no** mueve stock. |
| X-07 | El maestro de **Clientes** pertenece a **Administración**; Ventas solo consulta identidad. |
| X-08 | El POS no edita productos ni costos; consulta catálogo / precios de venta. |
| X-09 | Postventa física (cambios / devolución vía cambio) sí solicita efectos al Engine. |
| X-10 | Compras / Importaciones no están en el alcance documental oficial actual. |
