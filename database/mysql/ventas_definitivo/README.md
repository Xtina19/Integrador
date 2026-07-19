# Ventas DEFINITIVO — MySQL pack VEN-DB-1.0.0

Paquete de esquema de producción para el módulo Ventas de LibroSys (Aggregate `Venta` = factura).

## Instalación

Desde `database/mysql`:

```bash
mysql -u root -p librosys < install_ventas_definitivo.sql
```

O instalación completa del ERP:

```bash
mysql -u root -p < install_all.sql
```

## Contenido

Ver `database/docs/VENTAS_BD_DEFINITIVA.md`.

Orden: `00` → `01` → `01b` → `02`…`10` (versionado en `ventas_schema_version`).

Las tablas legado `venta` / `detalle_venta` **no** se usan por este paquete.
