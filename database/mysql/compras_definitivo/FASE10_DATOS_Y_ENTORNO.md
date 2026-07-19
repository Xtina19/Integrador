# FASE 10 — Datos iniciales realistas y validación del entorno

**Módulo:** Compras (Librería Joselito / LibroSys)  
**Fecha:** 2026-07-19  
**Alcance:** Semilla realista + diagnóstico de entorno. Sin cambios de reglas de negocio.

---

## 1. Registros insertados / actualizados por tabla

| Tabla | Cantidad | Notas |
|-------|----------|--------|
| `editoriales` | **15** | Panini, Ivrea, Norma, Santillana, Anaya, Océano, Planeta, PRH, HarperCollins, SM, Susaeta, Hidra, Plutón, Urano, Alfaguara |
| `proveedores` | **12** | RD + internacionales (Corripio, Santillana Dominicana, Panini México, Ivrea Argentina, etc.) |
| `productos` | **22** | Libros y mangas reales con ISBN |
| `categorias` | **+3** (total 6) | Cómics/manga, Negocios, Tecnología |
| `condiciones_pago` | **6** | Contado, Crédito 15/30/45/60, Anticipo 50% |
| `numeracion_documentos` | **3** | OC / REC / FP 2026 |
| `orden_compra` | **8** | Todos los estados operativos |
| `detalle_orden_compra` | **17** | |
| `recepcion` | **4** | Completas, parcial y borrador |
| `detalle_recepcion` | **8** | |
| `factura_proveedor` | **4** | pagada / parcial / pendiente |
| `detalle_factura_proveedor` | **10** | |

### Estados de órdenes presentes

`borrador`, `pendiente_aprobacion`, `aprobada`, `parcialmente_recibida`, `recibida`, `cancelada`, `cerrada`

### Recepciones

- Completas confirmadas (OC recibida / cerrada)
- Parcial confirmada (manga Panini)
- Borrador pendiente de confirmar (Ivrea)

### Facturas proveedor (`estado_pago`)

- `pagada` — FP-2026-000001 (Corripio)
- `parcial` — FP-2026-000002 (Anticipo 50% Panini)
- `pendiente` — FP-2026-000003 / FP-2026-000004

Script: `database/mysql/compras_definitivo/11_seed_joselito.sql`  
Instalación: `database/mysql/compras_definitivo/install.sql`

---

## 2. Datos reales utilizados (muestra)

**Editoriales:** Planeta, Penguin Random House, Panini, Ivrea, Norma, Santillana, Anaya, Océano, HarperCollins, SM, Susaeta, Hidra, Plutón, Urano, Alfaguara.

**Proveedores:** Distribuidora Corripio, Editorial Planeta, Santillana Dominicana, Panamericana Editorial, Penguin Random House Grupo Editorial, Editorial Norma, Ivrea Argentina, Panini México, Océano Dominicana, SM Dominicana, HarperCollins Latam, Urano Ediciones.

**Productos (ejemplos):** Cien años de soledad, Don Quijote, El Principito, Hábitos Atómicos, Padre Rico Padre Pobre, Clean Code, Harry Potter, One Piece, Naruto, Jujutsu Kaisen, Chainsaw Man, Spy x Family, Blue Lock, Berserk, 1984, Rayuela, Sapiens, etc. — con ISBN reales, costos/precios DOP coherentes y monedas DOP/EUR en documentos.

---

## 3. Estado del Backend

| Ítem | Estado |
|------|--------|
| Arranque Express | **OK** — `Servidor corriendo en http://localhost:3001` |
| Comando correcto | Desde `backend/`: **`npm run start`** (producción/dev simple) o **`npm run dev`** (nodemon) |
| Comandos inexistentes en raíz | No hay `npm run server` / `npm run backend` en el monorepo |
| Rutas Compras | `/api/compras/*` y alias `/api/v1/compras/*` |
| CORS | Activo (`Access-Control-Allow-Origin: *`) |
| Middleware | `traceId`, `authPlaceholder`, `errorHandler`; escrituras con `comprasAuth` |

### Evidencia API (sin mocks)

```
GET /api/compras/ordenes          → success, total=8
GET /api/compras/recepciones      → success, total=4
GET /api/compras/facturas         → success, total=4
GET /api/compras/condiciones-pago → success, 6 condiciones
GET /api/proveedores              → 12
GET /api/productos                → 22
GET /api/monedas                  → 4
```

Frontend configurado con `VITE_USE_API_COMPRAS=true` y `VITE_API_URL=http://localhost:3001`.

---

## 4. Estado MySQL

| Ítem | Estado |
|------|--------|
| Motor | MariaDB 10.4.32 (XAMPP) en `127.0.0.1:3306` |
| Base | `librosys` |
| Pool backend | `mysql2` vía `DB_HOST` / `MYSQL_USER` / `DB_NAME` |
| Conexión app | **OK** (`SELECT COUNT(*) FROM orden_compra` → 8) |

---

## 5. Errores encontrados y corregidos

| Causa exacta | Efecto | Corrección |
|--------------|--------|------------|
| `backend/.env` solo tenía variables **MSSQL** legacy; faltaban `PORT`, `DB_HOST`, `DB_NAME`, `MYSQL_USER`, `MYSQL_PASSWORD` | Compras no podía usar MySQL; el FE reportaba backend no disponible al fallar el hydrate | Se completó `.env` con MySQL + `PORT=3001` (MSSQL se conserva para `/api/test-db`) |
| MySQL/XAMPP **detenido** (puerto 3306 cerrado) | Sin BD | Se inició MySQL (`mysql_start.bat` / XAMPP) |
| Esquema Compras **no instalado** en `librosys` (faltaban `orden_compra`, `condiciones_pago`, etc.) | API fallaría aunque el servidor arrancara | `SOURCE install.sql` del paquete `compras_definitivo` |
| Catálogo mínimo (2 productos / 2 proveedores genéricos) | Datos insuficientes / poco realistas | Semilla FASE 10 en `11_seed_joselito.sql` |
| Índice duplicado `idx_detalle_factura_doc_oc` en `10_indices.sql` vs KEY en `09_*` | Warning/ERROR 1061 al reinstalar | Índice renombrado a `idx_detalle_factura_linea_oc` + `CREATE INDEX IF NOT EXISTS` |
| Bridge Importaciones refería `detalle_orden_id` 6–7 | Desalineado tras nuevo seed | Actualizado a líneas 7–8 en `12_seed_importaciones_bridge.sql` |

**No** era un “backend genérico caído”: la cadena rota era **.env MySQL + MySQL apagado + schema/seed Compras ausente**.

---

## 6. Cómo levantar el entorno (desarrollo ERP)

```bash
# 1) MySQL (XAMPP) — puerto 3306
# 2) Backend
cd backend
npm run start          # o: npm run dev

# 3) Frontend
cd Frontend
npm run dev            # Vite; requiere VITE_USE_API_COMPRAS=true
```

Reinstalación schema+seed Compras:

```bash
cd database/mysql/compras_definitivo
mysql -u root --default-character-set=utf8mb4 librosys -e "SOURCE install.sql"
```

---

## 7. Conclusión

El módulo Compras opera contra **MySQL real** (sin mocks) con catálogo y documentos coherentes con Librería Joselito. Backend Express responde en `:3001`, CORS abierto, y el Frontend puede hidratar dashboard / órdenes / recepciones / facturas / catálogos vía API.
