# 04 — Base de datos

## Objetivo

Describir el **instalador oficial** y cómo se relacionan los scripts con cada módulo.

---

## Instalador oficial

**Fuente de verdad:** `database/sqlserver/`

| Paso | Archivo |
|------|---------|
| Índice | `install.sql` + `README.md` |
| 01 | `01_Database.sql` |
| 02 | `02_Seguridad.sql` |
| 03 | `03_Administracion.sql` |
| 04 | `04_Catalogo.sql` |
| 05 | `05_Inventario.sql` |
| 06 | `06_Compras.sql` |
| 07 | `07_Ventas.sql` |
| 08 | `08_Views.sql` |
| 09 | `09_StoredProcedures.sql` |
| 10 | `10_Indexes.sql` |
| 11 | `11_SeedData.sql` |
| 12 | `12_Editoriales.sql` |

Ver también `database/Shared/README.md`.

> Pueden existir packs históricos bajo `database/mysql/` o material en `docs/`. Para instalaciones nuevas del ERP alineado a esta guía, usar **SQL Server** (`database/sqlserver/`).

---

## Copias de navegación por módulo

| Módulo | Copia en `Modulos/` | Oficial |
|--------|---------------------|---------|
| Inventario | `Database/schema.sql`, `views.sql`, `procedures.sql` | `05`, `08`, `09` |
| Compras | `Database/schema.sql` | `06_Compras.sql` |
| Ventas | `Database/schema.sql` | `07_Ventas.sql` |
| Editoriales | `Database/schema.sql` | `12_Editoriales.sql` (tabla base en `03`) |

**No ejecutar** las copias de `Modulos/*/Database` como instalador. Editar siempre el pack oficial y sincronizar la copia.

---

## Inventario — tablas clave (orientativo)

| Tabla / concepto | Rol |
|------------------|-----|
| Existencias producto×almacén | Stock |
| Movimiento / kardex | Ledger |
| Transferencia, ajuste, conteo, descarte | Documentos de proceso |

Detalle: [modulos/Inventario](./modulos/Inventario/README.md).

---

## Compras — tablas clave (orientativo)

OC, recepción, factura proveedor, numeración, condiciones de pago.  
Detalle: [modulos/Compras](./modulos/Compras/README.md).

---

## Ventas — tablas clave (orientativo)

| Concepto | Rol |
|----------|-----|
| ventas + líneas | Factura (aggregate) |
| pagos | Cobro |
| cambios | Postventa física |
| notas_credito | NC comercial |
| historial | Auditoría comercial |

Detalle: [modulos/Ventas](./modulos/Ventas/README.md).

---

## Editoriales

Tabla base en administración + script de módulo `12_Editoriales.sql` (constraints / SPs).  
Detalle: [modulos/Editoriales](./modulos/Editoriales/README.md).

---

## Notas

- Inventario es el único dueño de existencias a nivel de reglas (aunque varias tablas vivan en el mismo pack).
- Tras cambiar un `.sql` oficial, actualizar la copia del módulo correspondiente y la sección afectada en `guia/modulos/<Modulo>/`.
