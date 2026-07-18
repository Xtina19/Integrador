# Documentación oficial — Módulo Inventario (LibroSys)

**Estado del módulo:** cerrado funcionalmente  
**Documentación:** INV-DOCS-1.0 (2026-07-18)  
**Audiencia:** desarrolladores, analistas, QA y usuarios operativos

Esta carpeta documenta **exactamente lo implementado** en Inventario. No introduce funcionalidad nueva.

---

## Índice general

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Introducción](./01-introduccion.md) | Propósito, alcance, ubicación en el repo, principios |
| 02 | [Arquitectura](./02-arquitectura.md) | Frontend, backend DDD, Engine, montaje, persistencia |
| 03 | [Reglas de negocio](./03-reglas-negocio.md) | Validaciones reales de dominio y operación |
| 04 | [Modelo de dominio](./04-modelo-dominio.md) | Agregados, entidades, VOs, estados y métodos |
| 05 | [Casos de uso](./05-casos-uso.md) | Application Services / Handlers ↔ HTTP |
| 06 | [Flujos](./06-flujos.md) | Diagramas de transferencia, ajuste, descarte, conteo |
| 07 | [Pantallas](./07-pantallas.md) | Rutas UI, tabs, páginas de crear/detalle/fases |
| 08 | [API](./08-api.md) | Endpoints `/api/inventario`, auth, clientes FE |
| 09 | [Base de datos](./09-base-datos.md) | Esquema MySQL INV-DB-1.0.0 |
| 10 | [Procedimientos almacenados](./10-procedimientos-almacenados.md) | Catálogo `sp_inv_*` |
| 11 | [Funciones, triggers y vistas](./11-funciones-triggers-vistas.md) | `fn_inv_*`, `trg_*`, `v_inv_*` |
| 12 | [Seeders](./12-seeders.md) | Joselito Node + MySQL |
| 13 | [Pruebas](./13-pruebas.md) | Automatizadas, build, checklist manual |
| 14 | [Manual técnico](./14-manual-tecnico.md) | Arranque, mapa de código, contratos |
| 15 | [Manual de usuario](./15-manual-usuario.md) | Guía operativa Joselito |

---

## Lectura recomendada por rol

| Rol | Ruta sugerida |
|-----|----------------|
| Analista funcional | 01 → 03 → 05 → 06 → 07 → 15 |
| Desarrollador backend | 02 → 04 → 05 → 08 → 14 |
| Desarrollador frontend | 02 → 07 → 08 → 06 → 14 |
| DBA | 09 → 10 → 11 → 12 |
| QA | 06 → 07 → 13 → 15 |

---

## Referencias relacionadas (fuera de esta carpeta)

| Documento | Ruta |
|-----------|------|
| BD definitiva (detalle) | `database/docs/INVENTARIO_BD_DEFINITIVA.md` |
| Informe cierre funcional | `database/docs/INVENTARIO_CIERRE_ENTREGA.md` |
| Pack SQL | `database/mysql/inventario_definitivo/` |
| Código dominio | `backend/src/modules/inventario/` |
| UI módulo | `Frontend/src/modules/inventario/` |

---

## Restricciones de mantenimiento

- No agregar nuevas funcionalidades al módulo Inventario.
- No modificar el dominio ni el Inventory Engine salvo corrección de errores autorizada.
- No modificar la base de datos salvo correcciones derivadas de pruebas.
- No iniciar Ventas, Compras ni Importaciones desde este alcance documental.
