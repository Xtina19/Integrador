# Estándar monetario global — LibroSys

**Vigencia:** 2026-07-19 (FASE GLOBAL)

## Tipos canónicos

| Concepto | Tipo MySQL | Uso |
|----------|------------|-----|
| Importes, totales, precios de venta, impuestos, descuentos en monto | **`DECIMAL(18,2)`** | Documentos Compras / Ventas / Eventos / Importaciones |
| Costos unitarios, costeo, costo de referencia | **`DECIMAL(18,4)`** | Detalles OC/REC/FP, `productos.costo`, costeo importaciones |
| Tasas de cambio | **`DECIMAL(18,6)`** | `tasas_cambio.tasa`, `tasa_cambio` en documentos |

## Prohibido para dinero

- `INT` / `BIGINT` / `INTEGER`
- `FLOAT` / `DOUBLE` / `REAL`
- `DECIMAL(...,0)` (sin centavos)
- `DECIMAL(12,2)` u otras precisiones ad-hoc

## Conversiones

- **Fuente única:** tablas `monedas` + `tasas_cambio`.
- Los servicios **no** deben hardcodear tasas (p. ej. 58.5, 63.2) ni asumir `tasa_cambio = 1` para monedas extranjeras.
- Si no hay tasa vigente origen→DOP (o destino del documento), la operación debe **fallar** con error claro.

## Aplicación

```bash
cd database/mysql/estandar_monetario
mysql -u root --default-character-set=utf8mb4 librosys -e "SOURCE 01_migrate_money_types.sql"
```
