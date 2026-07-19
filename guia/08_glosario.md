# 08 — Glosario

| Término | Significado en LibroSys |
|---------|-------------------------|
| **Venta / Factura** | Mismo agregado `Venta`; documento comercial emitido |
| **POS** | Punto de Venta; emite ventas nuevas |
| **Nota de Crédito (NC)** | Documento derivado de una factura; crédito a favor del cliente |
| **notaCreditoId** | ID interno de NC usado en pagos (no texto libre) |
| **Inventory Engine** | Núcleo de dominio que aplica mutaciones de stock |
| **Existencia** | Saldo de un producto en un almacén |
| **Movimiento** | Asiento en el ledger (`movimiento_inventario`) |
| **Cambio** | Postventa de mercancía sobre una factura |
| **Pago mixto** | Varias formas de pago en una misma emisión |
| **Expediente** | Detalle de factura con pestañas (historial, NC, inventario…) |
| **ACL clientes** | Vista mínima id/nombre/activo que Ventas conoce del maestro |
| **Composition** | Wiring de dependencias al montar un módulo |
| **dominio_id** | UUID de aplicación mapeado a PK INT en MySQL |
| **Referencia (pago)** | Campo **eliminado**; no usar |
| **Devoluciones (menú)** | **No existe**; usar Cambios |

---

## Notas

Ampliar este glosario al incorporar módulos nuevos.
