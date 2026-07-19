# Documentación oficial — Módulo Inventario (LibroSys)

**Estado del módulo:** implementado y operativo  
**Documentación:** INV-DOCS (actualizado 2026-07-18)  
**Código:** `backend/src/modules/inventario/` · `Frontend/src/modules/inventario/`  
**API:** `/api/inventario`  
**BD:** `database/mysql/inventario_definitivo/`

Inventario controla existencias, movimientos, transferencias, ajustes, conteos físicos, descartes y costeo operativo mediante el **Inventory Engine**.

---

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Introducción](./01-introduccion.md) | Propósito, alcance, principios |
| 02 | [Arquitectura](./02-arquitectura.md) | FE/BE DDD, Engine, montaje |
| 03 | [Reglas de negocio](./03-reglas-negocio.md) | Validaciones de dominio |
| 04 | [Modelo de dominio](./04-modelo-dominio.md) | Agregados, VOs, estados |
| 05 | [Casos de uso](./05-casos-uso.md) | Services / Handlers ↔ HTTP |
| 06 | [Flujos](./06-flujos.md) | TRF, ajuste, descarte, conteo |
| 07 | [Pantallas](./07-pantallas.md) | Rutas UI |
| 08 | [API](./08-api.md) | Endpoints |
| 09 | [Base de datos](./09-base-datos.md) | Esquema MySQL |
| 10 | [Procedimientos](./10-procedimientos-almacenados.md) | `sp_inv_*` |
| 11 | [Funciones / triggers / vistas](./11-funciones-triggers-vistas.md) | |
| 12 | [Seeders](./12-seeders.md) | Joselito |
| 13 | [Pruebas](./13-pruebas.md) | Automatizadas + checklist |
| 14 | [Manual técnico](./14-manual-tecnico.md) | Arranque y mapa de código |
| 15 | [Manual de usuario](./15-manual-usuario.md) | Operación |

---

## Integración con Ventas

Ventas consume el Engine compartido para salida de venta, anulación y cambios.  
Las Notas de Crédito **no** mueven stock.

Ver: [../sales/integration-inventory.md](../sales/integration-inventory.md) · [../business-rules/cross-module.md](../business-rules/cross-module.md)

---

## Referencias

| Recurso | Ruta |
|---------|------|
| Índice docs global | [../README.md](../README.md) |
| BD resumida | [../database/inventory.md](../database/inventory.md) |
| API resumida | [../api/inventory.md](../api/inventory.md) |
| Pack SQL | `database/mysql/inventario_definitivo/` |

---

## Mantenimiento

- Documentar solo lo implementado.  
- No ampliar alcance Inventario desde la documentación.  
- Actualizar estos archivos cuando cambie el código del módulo.
