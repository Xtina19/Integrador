# Guía oficial — LibroSys

**Qué es esta carpeta:** la guía viva del proyecto para cualquier desarrollador que se incorpore.  
**Qué no es:** no reemplaza `docs/` (documentación técnica detallada). Aquí se explica el *cómo y por qué* del sistema de forma narrativa y actualizada.

---

## Qué es LibroSys

LibroSys es un ERP para librería (contexto Joselito) que integra operación comercial e inventario: punto de venta, facturación, postventa, notas de crédito y control de existencias.

---

## Objetivo del proyecto

Construir un sistema modular con reglas de negocio claras:

- Un solo dueño del stock (Inventario / Engine).
- Ventas centradas en la factura.
- Maestros (clientes, productos) fuera de los módulos operativos cuando corresponde.
- Documentación alineada al código real.

---

## Estado actual

| Módulo | Estado |
|--------|--------|
| **Inventario** | Terminado / operativo |
| **Ventas** | Terminado / operativo |
| Administración (maestros UI) | Operativo (clientes, productos, etc.) |
| Compras | Pendiente — **no iniciar** hasta actualizar esta guía |
| Importaciones / Editoriales / Eventos | Prototipo UI; fuera de esta guía |

Stack principal: `Frontend/` (React + Vite) · `backend/` (Express + DDD TS) · MySQL packs en `database/mysql/`.

---

## Módulos existentes (documentados aquí)

1. [Inventario](./05_modulos/Inventario.md)  
2. [Ventas](./05_modulos/Ventas.md)

---

## Cómo navegar la guía

| Orden | Documento | Para qué |
|-------|-----------|----------|
| 1 | Este README | Orientación y estado |
| 2 | [01 Visión](./01_vision_del_proyecto.md) | Propósito y alcance |
| 3 | [02 Arquitectura](./02_arquitectura_general.md) | Capas y conexiones |
| 4 | [03 Reglas de negocio](./03_reglas_de_negocio.md) | Reglas vigentes |
| 5 | [04 Base de datos](./04_base_de_datos.md) | Esquema real |
| 6 | [05 Módulos](./05_modulos/) | Detalle por módulo |
| 7 | [06 Decisiones](./06_decisiones/) | ADRs / porqués |
| 8 | [07 Flujos](./07_flujos/) | Secuencias + Mermaid |
| 9 | [08 Glosario](./08_glosario.md) | Términos |

Detalle técnico (API, procedimientos, manuales largos): ver carpeta [`docs/`](../docs/README.md).

---

## Mantenimiento

**Antes de iniciar un módulo nuevo del ERP**, actualizar `/guia` con el módulo recién cerrado.  
La guía debe representar siempre el estado real del sistema.
