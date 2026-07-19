# LibroSys Design System

**Versión:** DS-1.0.0  
**Fecha:** 2026-07-18  
**Estado:** Oficial — obligatorio desde el módulo Ventas en adelante  
**Módulo de referencia visual:** Inventario (`Frontend/src/modules/inventario/`)

Este documento estandariza la experiencia de usuario de todo el ERP.  
**No define reglas de negocio.** Solo consistencia visual y de interacción.

A partir de **Ventas**, ningún componente visual nuevo deberá romper este estándar. Los módulos existentes deben converger hacia él en mantenimiento.

---

## 1. Principios de UX

1. **Datos primero, texto después.** Priorizar tablas, KPIs y acciones sobre párrafos explicativos.
2. **Jerarquía funcional (obligatoria).**
   - **Dashboard (Centro de control)** = estado general del módulo.
   - **Pestañas** = procesos (con sus propios indicadores).
   - **Tablas** = detalle de los procesos.
   - No duplicar información entre estos niveles.
3. **Una sola vez.** Cada métrica aparece en un solo lugar (global o de proceso, nunca ambos).
4. **Contexto = explicación.** Si el usuario ya está en la pestaña, no repetir qué es esa pestaña.
5. **Acciones contextuales.** Los botones superiores dependen de la pantalla/pestaña activa.
6. **Procesos en páginas.** Flujos principales (crear, detalle, fases) usan pantalla completa; no modales para procesos operativos del dominio.
7. **Componentes compartidos.** Usar `@/components/ui/*` y layouts documentados; no reinventar botones, badges o tabs.

---

## 2. Marca y color

### Tokens (`tailwind.config.js`)

| Token | Valor | Uso |
|-------|-------|-----|
| `corporate` | `#1E2D86` | Primario: títulos, tabs activos, links, foco |
| `corporate-dark` | `#151f63` | Hover secundario |
| `corporate-light` | `#2a3da0` | Acentos ligeros |
| `gold` | `#F4D22E` | CTA primario (botón Guardar / acción principal) |
| `gold-dark` | `#d4b520` | Hover CTA |
| `surface` | `#F5F5F5` | Fondo de página (`body`) |

### Neutrales (Tailwind)

| Uso | Clase |
|-----|--------|
| Texto principal | `text-gray-800` / `text-slate-900` |
| Texto secundario | `text-gray-500` / `text-slate-500` |
| Bordes de tarjeta | `border-gray-200` / `border-slate-200` |
| Fondo card | `bg-white` |
| Hover fila | `hover:bg-gray-50/80` |

### Semántica de estado (badges / acentos KPI)

| Significado | Badge variant | Acento borde KPI |
|------------|---------------|------------------|
| Éxito / aplicado / recibido / normal | `success` (emerald) | `border-l-emerald-500` |
| Advertencia / pendiente / solicitado | `warning` (amber) | `border-l-amber-500` |
| Error / cancelado / agotado / negativo | `danger` (red) | `border-l-rose-500` |
| Información / aprobado / abierto | `info` (blue) | `border-l-blue-500` |
| Neutro / borrador | `neutral` (gray) | `border-l-slate-400` |
| Destacado / en tránsito / revertido | `gold` | `border-l-gold` |

Componente: `Badge` (`Frontend/src/components/ui/Badge.tsx`).

---

## 3. Tipografía

| Rol | Clases estándar |
|-----|-----------------|
| Fuente | `Inter` (`font-sans`) |
| Título de módulo (H1) | `text-2xl font-bold tracking-tight text-corporate` |
| Título de sección / card | `text-base font-semibold text-gray-900` |
| Label de centro de control | `text-sm font-semibold uppercase tracking-wide text-slate-500` |
| Cuerpo | `text-sm text-gray-700` |
| Meta (fechas, secundarios) | `text-xs text-slate-500` |
| Códigos de documento | `font-mono text-xs font-medium text-corporate` |
| Números KPI | `text-xl` o `text-lg` + `font-bold tabular-nums` |
| Encabezado de columna tabla | `text-xs font-semibold text-gray-500 uppercase tracking-wider` |

**Prohibido:** subtítulos largos bajo el H1 que expliquen el módulo. Subtítulo solo si aporta dato no obvio (y preferible omitirlo).

---

## 4. Espaciado y layout de página

| Elemento | Estándar |
|----------|----------|
| Contenedor de página | `space-y-5` (listados) o `space-y-6` (formularios / detalle) |
| Header módulo (título + acciones) | `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` |
| Gap entre botones de acción | `gap-2` |
| Padding card body | `px-6 py-4` (`CardBody`) |
| Padding card header | `px-6 py-4` + `border-b border-gray-100` |
| Padding KPI strip | `p-4 sm:p-5` |
| Grid KPI global | `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6` + `gap-3` |
| Grid KPI de proceso | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` + `gap-2` |
| Campos de formulario | `grid grid-cols-1 md:grid-cols-2 gap-5` |
| Celdas de tabla | `px-4 py-3` |

Radio:

| Elemento | Radio |
|----------|-------|
| Cards / diálogos | `rounded-xl` |
| Botones / inputs / tabs container | `rounded-lg` |
| Tab item / chip / badge | `rounded-md` / badge `rounded-full` |

---

## 5. Encabezados de módulo

### Patrón listado (referencia Inventario)

```
[ H1: Gestión de {Módulo} ]     [ Acciones de la pestaña activa ]
[ Centro de control — KPIs globales ]
[ Tabs ]
[ Contenido de pestaña ]
```

Reglas:

- Un solo H1 por vista.
- Sin párrafo descriptivo bajo el H1.
- Acciones superiores **solo** las de la pestaña/proceso activo.
- El Header del layout puede mostrar título de ruta; evitar duplicar el mismo subtítulo explicativo en el contenido.

### Patrón crear / editar

Usar `FormPageLayout`:

1. Breadcrumb + **Regresar**
2. Card con título (sin subtítulo redundante)
3. Formulario
4. Pie: **Cancelar** (outline) + **Guardar** (primary + icono Save)

### Patrón detalle / workflow

Usar `DetailPageShell` (o equivalente):

1. Breadcrumb + **Regresar**
2. H1 + badge de estado opcional + acciones de transición
3. Cards de contenido
4. Loading: spinner centrado (`Loader2`)
5. Error: banner `border-red-100 bg-red-50 text-red-700`

---

## 6. Tarjetas KPI

### Centro de control (global del módulo)

- Contenedor: `rounded-xl border border-slate-200 bg-white p-4 sm:p-5`
- Título: “Centro de control” (uppercase tracking)
- Cada KPI: borde izquierdo de color semántico (`border-l-4`), valor grande, label 11px
- **Solo indicadores globales del inventario.** Prohibido incluir métricas de procesos operativos.

Ejemplos válidos (Inventario):

- Stock total
- Productos bajo stock
- Productos sin stock
- Almacenes / productos bloqueados
- Valor del inventario (cuando exista costeo)
- Última actualización

Ejemplos **prohibidos** en el Centro de control:

- Transferencias activas / pendientes
- Conteos abiertos
- Ajustes pendientes
- Descartes pendientes

Referencia: `InventoryDashboard.tsx`

### KPI de proceso (dentro de pestaña)

- Componente patrón: `ProcessStatCards`
- Cada pestaña de proceso muestra **solo** sus indicadores de estado
- Pueden ser clicables para filtrar la tabla
- Estado activo: `bg-corporate text-white`
- **No repetir** aquí lo que ya está en el Centro de control

Referencia Inventario:

| Pestaña | Indicadores |
|---------|-------------|
| Transferencias | Pendientes, En tránsito, Recibidas, Canceladas |
| Conteos | Borrador, Captura, Revisión, Cerrados |
| Ajustes | Pendientes, Aplicados, Revertidos |
| Descartes | Solicitados, Aprobados, Aplicados |
| Movimientos | **Sin KPIs** (libro mayor: filtros + tabla + export + acciones) |

---

## 7. Tabs

### Módulo con rutas (sidebar sections)

Usar `ModuleTabs` (`NavLink`):

- Contenedor: `bg-white rounded-lg border border-gray-200 p-1`
- Activo: `bg-corporate text-white`
- Inactivo: `text-gray-600 hover:bg-gray-50`
- Texto: `text-sm font-medium`
- Icono opcional: Lucide size **16**

### Tabs internos (query `?tab=`)

Patrón Inventario (`InventoryTabNav`):

- Misma cápsula blanca con borde
- Labels cortos: General, Movimientos, Transferencias… (no “Inventario General”)
- Activo: fondo `corporate`

---

## 8. Tablas

Componente: `Table` (`@/components/ui/Table` → `tables/Table.tsx`)

| Aspecto | Estándar |
|---------|----------|
| Header | Fondo `bg-gray-50/80`, uppercase xs |
| Filas | `divide-y divide-gray-100`, hover suave |
| Códigos | mono + `text-corporate` |
| Fechas / meta | `text-xs text-slate-500` |
| Cantidades | `tabular-nums` |
| Acciones | columna final, `Button size="sm" variant="outline"` |
| Vacío | ver §16 |
| Highlight | `bg-gold/15 ring-gold/50` |

Dentro de Card: `CardBody className="!p-0"` y filtros en `p-4 pb-0` encima de la tabla.

---

## 9. Formularios

| Control | Componente |
|---------|------------|
| Texto / número / date | `Input` |
| Select | `Select` |
| Texto largo | `Textarea` |
| Label | `text-sm font-medium text-gray-700` |
| Foco | `focus:border-corporate focus:ring-2 focus:ring-corporate/20` |
| Error campo | borde `red-400` + texto `text-xs text-red-500` |
| Error de página | banner rojo como en DetailPageShell |

Secciones de formulario largo: varias `Card` numeradas (`1. Información general`) **sin** subtítulos pedagógicos.

Campos obligatorios: asterisco en el label (`Label *`).

---

## 10. Filtros y toolbar

Componente: `Toolbar`

- Búsqueda con icono `Search`
- Filtros en grid junto a la búsqueda
- Export PDF/Excel: `Button outline sm` + icono `Download`
- Chips de filtro activo: `Badge variant="gold"`

Chips de proceso (tipo grupo / motivo):

```
activo: border-corporate bg-corporate text-white
inactivo: border-slate-200 bg-white text-slate-600
```

Clase tipográfica chip: `rounded-md border px-2.5 py-1 text-xs font-medium`

---

## 11. Botones

Componente: `Button`

| Variant | Uso |
|---------|-----|
| `primary` (gold) | Guardar / confirmar principal |
| `secondary` (corporate) | Acción secundaria fuerte |
| `outline` | Regresar, Cancelar, Detalle, Exportar |
| `ghost` | Acciones terciarias en toolbars densas |
| `danger` | Eliminar / confirmar destructivo |

| Size | Uso |
|------|-----|
| `sm` | Tablas, Regresar, chips toolbar |
| `md` | Default en headers |
| `lg` | CTAs aislados de alto impacto (raro) |

Iconos Lucide: sm=14, md=16, lg=20. Siempre a la izquierda del texto (`gap-2`).

Jerarquía en header de módulo: **una** acción primary como máximo; el resto outline.

---

## 12. Iconos

- Librería: **lucide-react**
- No mezclar sets de iconos
- Tamaños: 12 (inline table), 14 (sm button), 16 (default), 20–22 (alerta diálogo)
- Color: hereda del botón o `text-slate-400` / `text-corporate` según contexto

---

## 13. Badges y estados

Usar siempre `Badge` + mapeo de dominio → variant (ej. `statusBadges.ts` de Inventario).

Convención semántica:

| Estado típico | Variant |
|---------------|---------|
| borrador, cancelado | `neutral` |
| solicitado / pendiente / parcial | `warning` |
| aprobado / abierto | `info` |
| aplicado / recibido / cerrado / normal | `success` |
| rechazado / cancelado fuerte / agotado | `danger` |
| en_tránsito / revertido / destacado | `gold` |

Texto del badge: capitalizar o usar label humano; no exponer snake_case crudo si hay label map.

---

## 14. Breadcrumbs

Componente: `FormBreadcrumb`

- Separador: `ChevronRight` size 14, `text-gray-300`
- Links: `text-corporate hover:underline`
- Ítem actual: `text-gray-700 font-medium`
- Ruta típica: `Módulo → Subproceso → Acción`

---

## 15. Acciones

| Contexto | Patrón |
|----------|--------|
| Listado / tab | Acciones en header según tab; fila con Detalle/Gestionar outline sm |
| Detalle | Acciones de transición a la derecha del H1 |
| Formulario | Cancelar + Guardar fijos al pie |
| Destructivo | `ConfirmDialog` variant danger, nunca toast solo |

Labels preferidos: **Detalle**, **Gestionar**, **Regresar**, **Guardar**, **Cancelar**, **Exportar**, **Nuevo {entidad}**, **Crear {proceso}**.

---

## 16. Paginación

Componente: `Pagination`

- Pie de card: `border-t border-gray-100 px-6 py-4`
- Texto: “Mostrando {start}–{end} de {total} registros”
- Controles: Anterior / Página X de Y / Siguiente (`outline` sm)

---

## 17. Estados vacíos

Cuando `data.length === 0`:

- Mensaje centrado en el área de tabla: `text-sm text-slate-500 py-12 text-center`
- Texto útil: “No hay registros” o “No hay resultados con los filtros actuales”
- Si aplica, un CTA outline a crear el primer registro
- No usar ilustraciones complejas ni párrafos largos

---

## 18. Estados de carga

| Contexto | Patrón |
|----------|--------|
| Detalle / página | `Loader2` animado + “Cargando…” centrado en card blanca |
| Botón | `disabled` + texto “Guardando…” / “Exportando…” |
| Lista inicial | Preferir skeleton simple o el mismo loader; evitar layout shift brusco |

No bloquear toda la app con overlays opacos salvo diálogos.

---

## 19. Mensajes

### Toast (`useToast`)

- `showSuccess(message)` — confirmaciones cortas
- `showError(message)` — fallos de API / validación global
- Mensajes en español, una oración, sin jerga técnica (“Engine”, “UUID”) hacia el usuario final

### Inline

- Error de formulario: bajo el campo o banner superior
- Éxito persistente en página: evitar; preferir toast + navegación

---

## 20. Confirmaciones

Componente: `ConfirmDialog`

- Overlay `bg-black/40`
- Card `max-w-md rounded-xl`
- Icono alerta en contenedor coloreado
- Acciones: Cancelar outline + Confirmar (danger o warning)
- Uso obligatorio antes de eliminar o revertir operaciones irreversibles de UI

---

## 21. Cards

Componente: `Card` / `CardHeader` / `CardBody`

- Fondo blanco, borde gris, `rounded-xl`
- `CardHeader`: título obligatorio; **subtitle opcional y raramente usado**
- No anidar cards sin necesidad
- Listados densos: una card por bloque (filtros + tabla)

`StatCard` (dashboard home): icono en caja `bg-corporate/10 text-corporate`.

---

## 22. Dinero y números (UX)

- Moneda por defecto del ERP: **DOP**. Diseño multimoneda preparado (**DOP**, **USD**, **COP**); ver `docs/ventas/02-coherencia-datos-y-reglas.md`.
- Operación diaria Joselito: montos DOP **sin centavos** (enteros con `tabular-nums`). Centavos solo con justificación de negocio (p. ej. conversión).
- Separador miles según locale (`toLocaleString`) cuando se muestre moneda
- Deltas negativos en `text-red-600`; positivos en `text-emerald-700`
- Datos de ejemplo / demo: catálogo y nombres **reales** de Librería Joselito; prohibido relleno genérico (“Producto 1”, “Cliente 1”, “Empresa XYZ”).

---

## 23. Checklist para nuevos módulos (obligatorio)

Antes de merge de UI de un módulo nuevo (ej. Ventas):

- [ ] H1 único, sin párrafo explicativo redundante
- [ ] KPIs globales ≠ KPIs de pestaña (sin duplicar)
- [ ] Acciones superiores contextuales a la vista activa
- [ ] Tabs con labels cortos y estilo `ModuleTabs` / Inventario
- [ ] Tablas vía `Table` + badges vía `Badge`
- [ ] Formularios vía `Input`/`Select`/`Textarea` + `FormPageLayout` o equivalente
- [ ] Detalles vía shell con breadcrumb + Regresar
- [ ] Colores solo tokens corporate/gold + semántica documentada
- [ ] Iconos Lucide únicamente
- [ ] Empty / loading / error / confirm según §§16–20
- [ ] Sin modales para el flujo principal del dominio

---

## 24. Componentes canónicos (mapa)

| Necesidad | Import |
|-----------|--------|
| Botón | `@/components/ui/Button` |
| Badge | `@/components/ui/Badge` |
| Input / Select / Textarea | `@/components/ui/Input` |
| Card | `@/components/ui/Card` |
| Table | `@/components/ui/Table` |
| Toolbar | `@/components/ui/Toolbar` |
| Tabs de módulo | `@/components/ui/ModuleTabs` |
| Breadcrumb | `@/components/ui/FormBreadcrumb` |
| Form page | `@/components/ui/FormPageLayout` |
| Confirmación | `@/components/ui/ConfirmDialog` |
| Paginación | `@/components/ui/Pagination` |
| Toast | `@/context/ToastContext` |
| KPI proceso (ref.) | `modules/inventario/components/ProcessStatCards` |
| KPI global (ref.) | `modules/inventario/components/InventoryDashboard` |
| Detalle (ref.) | `modules/inventario/components/DetailPageShell` |

---

## 25. Fuera de alcance de este documento

- Reglas de dominio / Inventory Engine
- Contratos de API
- Esquema MySQL
- Copy de ayuda largo (manual de usuario)

Esos viven en `docs/inventario/` y en la documentación técnica de cada módulo.

---

**Fin DS-1.0.0.**  
Cualquier excepción visual debe documentarse explícitamente en el PR del módulo correspondiente.
