# LibroSys — Base de datos SQL Server (Inventario, Compras y Ventas)

Esquema **equivalente** al MySQL definitivo de LibroSys para los módulos:

- Inventario (`INV-DB-1.0.0`)
- Compras (`COM-DB-1.0.0`)
- Ventas (`VEN-DB-1.2.0`)

más maestros compartidos (seguridad, administración, catálogo de productos).

**No modifica** backend, frontend, modelos, ORM ni la conexión actual del proyecto. Solo añade scripts en `database/sqlserver/`.

Compatible con **SQL Server 2022**.

---

## Orden exacto de ejecución

Ejecutar en SQL Server Management Studio o `sqlcmd`, **en este orden**, sobre una instancia limpia (o donde no exista aún `LibroSys`):

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `01_Database.sql` | Crea la base `LibroSys` (collation UTF-8) |
| 2 | `02_Seguridad.sql` | `roles`, `permisos`, `rol_permiso`, `usuarios` |
| 3 | `03_Administracion.sql` | `categorias`, `editoriales`, `proveedores`, `sucursales`, `almacenes`, `monedas`, `tasas_cambio` |
| 4 | `04_Catalogo.sql` | `productos` (forma final + master data) |
| 5 | `05_Inventario.sql` | Existencias, movimientos, transferencias, ajustes, conteos, descartes, auditoría, catálogos |
| 6 | `06_Compras.sql` | Condiciones de pago, numeración, OC, recepción, factura proveedor |
| 7 | `07_Ventas.sql` | Clientes, ventas, líneas, pagos, postventa, historial |
| 8 | `08_Views.sql` | Kardex, existencias, dashboards Inventario |
| 9 | `09_StoredProcedures.sql` | Funciones, SPs de Inventario, triggers |
| 10 | `10_Indexes.sql` | Índices de búsqueda y compuestos |
| 11 | `11_SeedData.sql` | Datos iniciales (roles, maestros, productos, stock, clientes POS) |

### Ejemplo con sqlcmd

```bat
sqlcmd -S localhost -E -I -i "01_Database.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "02_Seguridad.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "03_Administracion.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "04_Catalogo.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "05_Inventario.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "06_Compras.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "07_Ventas.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "08_Views.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "09_StoredProcedures.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "10_Indexes.sql"
sqlcmd -S localhost -E -I -d LibroSys -i "11_SeedData.sql"
```

> **Importante:** la bandera `-I` activa `QUOTED_IDENTIFIER ON` (requerido por índices filtrados). Los scripts también incluyen `SET QUOTED_IDENTIFIER ON` / `SET ANSI_NULLS ON` tras `USE LibroSys`.
---

## Conversiones MySQL → SQL Server

| MySQL | SQL Server |
|-------|------------|
| `AUTO_INCREMENT` | `IDENTITY(1,1)` |
| `TINYINT(1)` | `BIT` |
| `ENUM(...)` | `NVARCHAR(...)` + `CHECK` |
| `TEXT` / `JSON` | `NVARCHAR(MAX)` |
| `TIMESTAMP` | `DATETIME2(0)` |
| `ON UPDATE CURRENT_TIMESTAMP` | Triggers `trg_*_updated_at` |
| `ENGINE=InnoDB` / `CHARSET` / `COLLATE` | Eliminado; DB usa `Latin1_General_100_CI_AS_SC_UTF8` |
| `SIGNAL SQLSTATE` | `THROW 50000` |
| `LAST_INSERT_ID()` | `SCOPE_IDENTITY()` |
| `FOR UPDATE` | `WITH (UPDLOCK, ROWLOCK)` |
| `JSON_EXTRACT` / `JSON_LENGTH` | `OPENJSON` / `JSON_VALUE` |
| `UUID()` | `NEWID()` (vía `fn_inv_uuid` + vista auxiliar) |
| Unique + múltiples `NULL` | Índice único **filtrado** `WHERE col IS NOT NULL` |

### Nota sobre `ON UPDATE CASCADE` / `ON DELETE SET NULL`

SQL Server no permite **múltiples rutas CASCADE** hacia la misma tabla (error 1785), ni `ON DELETE SET NULL` en FKs auto-referenciadas, ni varios `SET NULL` concurrentes hacia la misma tabla padre. Donde MySQL lo permitía, estos scripts usan `ON UPDATE/DELETE NO ACTION` (equivalente funcional a `RESTRICT` en DELETE; los UPDATE de PKs no aplican en la práctica). Los nombres de columnas, tablas y FKs se conservan.

### Validación

Instalación verificada en **SQL Server 2022** sobre una base vacía temporal (`01`…`11` + seed + smoke insert inventario): **OK**.

Usar siempre `sqlcmd -I` (o los `SET QUOTED_IDENTIFIER ON` incluidos en cada script) por los índices filtrados.
---

## Nombres de tablas (sin cambios)

Se mantienen exactamente los nombres MySQL en minúsculas/snake_case (`orden_compra`, `movimiento_inventario`, `venta_lineas`, etc.).

---

## Cadena de conexión (posterior)

Cuando se decida apuntar la app a SQL Server, solo cambiar la connection string (p. ej. paquete `mssql` ya presente en el backend). **No forma parte de este entregable.**

Ejemplo orientativo:

```
Server=localhost;Database=LibroSys;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True
```

---

## Reporte final

| Métrica | Cantidad |
|---------|----------|
| **Tablas** | **55** (4 seguridad + 7 administración + 1 productos + 20 inventario + 9 compras + 14 ventas) |
| **Vistas** | **11** (8 operativas + 3 alias: `v_inventario_existencias`, `v_kardex_documento`, `v_auditoria_inventario`) |
| **Funciones** | **4** (`fn_inv_estado_stock`, `fn_inv_sentido_movimiento`, `fn_inv_valor_existencia`, `fn_inv_uuid`) |
| **Procedimientos almacenados** | **28** (núcleo + transferencias + ajustes + descartes + conteos) |
| **Triggers** | **33** (estado_stock, auditoría de transiciones, `updated_at`) |
| **Índices no únicos / compuestos** (`10_Indexes.sql`) | **142** |
| **Índices únicos filtrados** (NULL-safe) | **17** (en DDL de catálogo/inventario/ventas) |

### Equivalencia con MySQL

Confirmado:

- Mismos **nombres de tablas y columnas**.
- Mismas **PK / FK / UNIQUE / CHECK / DEFAULT**.
- Mismo **modelo de Inventario, Compras y Ventas** (packs definitivos).
- Kardex como **vista** sobre `movimiento_inventario` (no tabla física).
- Seed alineado a `12_seed.sql` + catálogos INV + puente Ventas Joselito.
- **Sin cambios** en código fuente de la aplicación.

### Fuera de alcance (intencional)

- Módulos Eventos, Importaciones, Configuración global, Auditoría ERP global (`auditoria`, etc.).
- Scripts legado (`venta`/`detalle_venta`, `ajuste_inventario`).
- Cambio de connection string del proyecto (paso posterior del usuario).
