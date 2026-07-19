# Documentación oficial — LibroSys

**Estado documental:** alineado al código (2026-07-18)  
**Módulos documentados:** Inventario · Ventas  
**Fuera de alcance:** Compras, Importaciones, Editoriales, Eventos (existen rutas UI prototipo; no forman parte de esta documentación oficial).

Esta carpeta es la **fuente de verdad técnica** del proyecto. Describe cómo funciona el sistema **hoy**, a partir del código en `Frontend/`, `backend/` y `database/mysql/`.

Para onboarding narrativo y decisiones: ver la guía viva [`../guia/README.md`](../guia/README.md).

---

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| [architecture/](./architecture/) | Visión general FE/BE/API/persistencia |
| [inventory/](./inventory/) | Módulo Inventario (completo) |
| [sales/](./sales/) | Módulo Ventas (completo) |
| [database/](./database/) | Esquema MySQL real (Inventario + Ventas) |
| [business-rules/](./business-rules/) | Reglas de negocio aprobadas e implementadas |
| [api/](./api/) | Contratos HTTP resumidos |
| [auditing/](./auditing/) | Auditoría y trazabilidad |
| [decisions/](./decisions/) | Decisiones de arquitectura vigentes |
| [design-system.md](./design-system.md) | Design System UI (DS-1.0.0) |

---

## Estado de módulos

| Módulo | Estado | Documentación |
|--------|--------|---------------|
| **Inventario** | Implementado y operativo | [inventory/](./inventory/) |
| **Ventas** | Implementado y operativo | [sales/](./sales/) |
| Administración (clientes/productos…) | Operativo (maestro) | Referenciado desde Ventas; sin carpeta propia aquí |
| Compras | No documentado / no cerrado | — |
| Importaciones | No documentado | — |
| Editoriales / Eventos | Prototipo UI | — |

---

## Lectura rápida

1. [architecture/overview.md](./architecture/overview.md) — capas y montaje  
2. [business-rules/README.md](./business-rules/README.md) — reglas cruzadas  
3. [inventory/README.md](./inventory/README.md) · [sales/README.md](./sales/README.md)  
4. [database/README.md](./database/README.md)  
5. [api/README.md](./api/README.md)  

---

## Principios de mantenimiento

- Documentar solo lo implementado.
- Si el código cambia, actualizar docs en el mismo cambio.
- No documentar módulos futuros aquí.
- No inventar endpoints, tablas ni flujos.
