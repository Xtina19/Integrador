# Master Data — Reporte de consolidación

**Fecha:** 2026-07-19  
**Paquete:** `database/mysql/master_data/`  
**Estado:** Instalado en MySQL `librosys`

---

## Principio confirmado

El ERP utiliza un **único Master Data** compartido. Los módulos futuros (Importaciones, Embarques, Costeo, Almacenes, Transferencias, Eventos, Reportes, Dashboard Ejecutivo, CxP, CxC) deben **consumir** estos catálogos y no crear paralelos.

---

## Conteos oficiales (post-install)

| Catálogo | Cantidad |
|----------|----------|
| **Productos** | **52** |
| **Editoriales** | **22** |
| **Categorías** | **8** |
| **Proveedores nacionales** | **5** |
| **Proveedores internacionales / mixtos** | **10** |
| **Clientes** | **11** |
| **Filas inventario (stock)** | **92** |
| **Movimientos iniciales** | **52** |
| **Monedas** | **4** (DOP base, USD, EUR, COP) |
| **Órdenes de compra** (existentes, usan maestro) | **8** |

Papelería de oficina en catálogo: **0**.

---

## Productos (giro librería)

Composición por subcategoría:

| Subcategoría | Cantidad |
|--------------|----------|
| Novela | 12 |
| Manga | 10 |
| Infantil | 4 |
| Desarrollo personal | 3 |
| Programación | 3 |
| Marvel / DC / Arte cómic | 5 |
| Accesorios (separadores, fundas, protectores, sleeves, lights, sujetalibros) | 7 |
| Universitario / ensayo / negocios / juvenil | resto |

Cada producto incluye (attrs master): código, ISBN (si aplica), código de barras, título, autor, editorial, categoría, subcategoría, idioma, país de origen, moneda de compra, costo, costo promedio, precio, peso, dimensiones, estado.

---

## Editoriales (22)

Alfaguara, Planeta, Penguin Random House, Panini, Ivrea, Norma, Santillana, Anaya, Océano, HarperCollins, SM, Susaeta, Hidra, Plutón, Urano, **Molino**, **Salamandra**, **RBA**, **DK**, **Taschen**, Marvel Comics, DC Comics.

---

## Autores (muestra)

García Márquez, Zafón, Cervantes, Saint-Exupéry, James Clear, Kiyosaki, Uncle Bob, Rowling, Oda, Kishimoto, Orwell, Allende, Austen, Benedetti, Coelho, Dahl, Stewart, Kotler, Bloch, Kleppmann, Tolle, Covey, Gotouge, Isayama, Stan Lee, Frank Miller, Alan Moore, etc.

---

## Proveedores

**Nacionales:** Corripio, Santillana Dominicana, Océano Dominicana, SM Dominicana, Distribuidora Librera del Caribe.

**Internacionales / mixtos:** Planeta, Panamericana, PRH, Norma, Ivrea, Panini México, HarperCollins Latam, Urano, Taschen, DK.

---

## Clientes

Cliente de Mostrador, Colegio La Salle, Instituto Iberia, PUCMM, UTESA, Colegio Sagrado Corazón, Librería Universitaria, Fundación Madre y Maestra, UASD, INTEC, Banco Popular (capacitaciones).

---

## Inventario

- Stock en Almacén Central (todos) y Santiago (subset).
- Ubicaciones por pasillo/estante.
- Movimientos de apertura `APERTURA-MD`.

## Compras / Ventas

- Órdenes existentes referencian `productos.id` del maestro (sin productos ad-hoc).
- POS / seed Ventas alineados a los mismos títulos/precios.
- Eliminada papelería del seed Inventario definitivo (sustituida por accesorios de lectura).

## Monedas

DOP / USD / EUR (+ COP). Formato UI central: `@/lib/money` · 2 decimales.

---

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `master_data/00_PRINCIPIO.md` | Regla permanente |
| `master_data/01_alter_productos_master.sql` | Columnas master + tablas inventario |
| `master_data/02_seed_catalogos.sql` | Cats / editoriales / proveedores / clientes |
| `master_data/03_seed_productos.sql` | Catálogo único 52 SKUs |
| `master_data/04_seed_inventario.sql` | Stock + kardex apertura |
| `install_all.sql` | Incluye `SOURCE master_data/install.sql` |

---

## Confirmación

**Sí:** el ERP dispone de Master Data único, sin papelería, con attrs suficientes para Importaciones/Costeo/Transferencias/Eventos/Reportes/CxP/CxC, y Compras/Ventas/Inventario apuntan al mismo catálogo `productos`.
