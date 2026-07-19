# Master Data — Principio permanente del ERP LibroSys

**Vigencia:** 2026-07-19  
**Alcance:** Catálogos oficiales compartidos por todos los módulos.

## Principio

A partir de esta fase el ERP trabaja con **Master Data único**.

Cualquier módulo nuevo (Importaciones, Embarques, Costeo, Almacenes, Transferencias, Eventos, Reportes, Dashboard Ejecutivo, CxP, CxC, Contabilidad, etc.) **debe consumir** estos catálogos.

**Prohibido** crear catálogos paralelos de productos, editoriales, proveedores, clientes o monedas cuando la información ya exista, salvo un requerimiento de negocio genuinamente nuevo.

## Catálogos canónicos

| Catálogo | Tabla(s) | Consumidores |
|----------|----------|--------------|
| Productos | `productos` (+ attrs master) | Inventario, Compras, Ventas, Importaciones, Costeo, Reportes |
| Categorías | `categorias` | Productos, Reportes |
| Editoriales | `editoriales` | Productos, Eventos, Reportes |
| Proveedores | `proveedores` | Compras, Importaciones, CxP |
| Clientes | `venta_clientes` (ACL Ventas; maestro comercial) | Ventas, CxC, Reportes |
| Monedas | `monedas` + `tasas_cambio` | Todo el ERP |
| Almacenes / stock | `almacenes` + `inventario` | Inventario, Transferencias, Ventas, Costeo |

## Giro del negocio

Librería especializada **LibroSys / Librería Joselito**:

- Libros, mangas, cómics oficiales, accesorios de lectura.
- **No** papelería de oficina (resmas, grapadoras, lápices, carpetas, etc.).

## Monedas

DOP (base), USD, EUR — preparados para nuevas monedas sin cambiar arquitectura.  
Importes: `DECIMAL(18,2)` · Formato UI: exactamente 2 decimales vía `@/lib/money`.

## Instalación

```bash
cd database/mysql/master_data
mysql -u root --default-character-set=utf8mb4 librosys -e "SOURCE install.sql"
```
