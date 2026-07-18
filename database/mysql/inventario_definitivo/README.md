# Inventario DEFINITIVO — MySQL pack INV-DB-1.0.0

Paquete de esquema de producción para el módulo Inventario de LibroSys.

## Instalación

Desde `database/mysql`:

```bash
mysql -u root -p librosys < install_inventario_definitivo.sql
```

O instalación completa del ERP:

```bash
mysql -u root -p < install_all.sql
```

## Contenido

Ver `database/docs/INVENTARIO_BD_DEFINITIVA.md` para el documento técnico completo.

Orden de scripts: `00` → `13` (versionado en `inventario_schema_version`).
