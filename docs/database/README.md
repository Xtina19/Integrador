# Base de datos — documentación oficial

**Objetivo:** Esquema **real** usado por Inventario y Ventas (MySQL `librosys`).

| Documento | Pack SQL |
|-----------|----------|
| [inventory.md](./inventory.md) | `database/mysql/inventario_definitivo/` |
| [sales.md](./sales.md) | `database/mysql/ventas_definitivo/` |

Instaladores: `database/mysql/install_inventario_definitivo.sql`, `install_ventas_definitivo.sql`, `install_all.sql`.

Documentación ampliada histórica (referencia): `database/docs/INVENTARIO_BD_DEFINITIVA.md`, `database/docs/VENTAS_BD_DEFINITIVA.md`.

---

## Nota sobre SQL Server

El backend legacy (`/api/productos`, `/api/test-db`) sigue usando **SQL Server** (`mssql`).  
Los módulos DDD Inventario/Ventas usan el pack **MySQL** definitivo cuando `sql` está configurado en composition; en demos también pueden operar in-memory.
