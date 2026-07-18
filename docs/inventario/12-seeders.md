# 12 — Seeders

El módulo Inventario tiene **dos semillas** con roles distintos: una para el runtime Node (DDD) y otra para MySQL definitivo.

---

## 1. Seeder runtime Node (Joselito)

**Archivo:** `backend/src/modules/inventario/infrastructure/composition/seedJoselito.ts`  
**Invocación:** `seedInventarioJoselitoCompleto` desde `mountInventarioModule` / `seedInventarioOperativo`.

### Contenido típico (medido en pruebas)

| Entidad | Cantidad aprox. |
|---------|-----------------|
| Productos | 50 (`prod-jsl-*`) |
| Existencias | ~295 |
| Almacenes | 8 (`central`, `suc-1`…`suc-5`, …) |
| Transferencias / Ajustes / Descartes / Conteos | 3 / 2 / 2 / 2 de ejemplo |
| Movimientos / Kardex / Auditorías | 4 / 4 / 4 |

### Reglas de datos

- Costos DOP enteros: 650, 895, 1200, 1500, 2500, 3500
- Editoriales/categorías/autores realistas
- Idempotente: no reinicia catálogo si ya hay productos cargados
- Documentos rehidratados con agregados de dominio (`rehidratar` + repos)

También existen semillas mínimas de tests: `seedInventarioBasico` / `seedInventarioOperativo` en `createInventarioComposition.ts`.

---

## 2. Seeder MySQL definitivo

**Archivo:** `database/mysql/inventario_definitivo/13_seed_joselito.sql`  
**Versión:** INV-DB-1.0.0

### Catálogo

- Categorías `CAT-LIT`, `CAT-INF`, `CAT-TXT`, `CAT-REF`, `CAT-PAP`
- Editoriales `ED-PRH`, `ED-PLAN`, `ED-ALF`, `ED-SM`, `ED-NOR`, `ED-SANT`, `ED-UASD`, `ED-LAR`, `ED-GEN`
- **47 productos** `JSL-001` … `JSL-047`
- ISBN rango `978-9945-9xx` (evita colisión con seeds legacy `978-9945-1xx` / `PRD-JSL-`)
- Costos/precios enteros DOP

### Operación

- Existencias por almacenes (`ALM-CTR`, `ALM-STI`, `ALM-LRM` u ids existentes del seed base)
- Documentos de ejemplo con códigos `JSL-TRF-*`, `JSL-CNT-*`, `JSL-ADJ-*`, `JSL-DSC-*`
- Generados preferentemente **llamando a `sp_inv_*`** (prueba del pack de procedimientos)
- Idempotencia: `INSERT … WHERE NOT EXISTS` / verificación por código

### Prerrequisito

Ejecutar tras seeds base del ERP (`12_seed.sql`, `21_seed_v2.sql`) que crean usuarios, sucursales y almacenes.

---

## 3. Stores JSON (no son seeders, pero alimentan demos)

Tras operar el API Node:

- `backend/data/inventario/inventario_snapshot.json`
- `backend/data/inventario/conteo_fisico_store.json`
- `backend/data/inventario/descarte_store.json`

Estos archivos preservan el estado entre reinicios cuando durable mode está activo.

---

## 4. Seeds legacy (no usar con pack definitivo)

- `25_inventario_seed_joselito.sql` → **DEPRECATED** / `archive/`
- No ejecutar junto a `inventario_definitivo/13_seed_joselito.sql` como fuente primaria; el pack definitivo es la referencia.

---

## 5. Cómo regenerar datos de prueba

**Node**

1. Borrar (opcional) `backend/data/inventario/*.json`
2. Reiniciar servidor → `mountInventarioModule` vuelve a sembrar Joselito

**MySQL**

```bash
cd database/mysql
mysql -u root -p librosys < install_inventario_definitivo.sql
```

(El install completo del ERP ya incluye el pack al final de `install_all.sql`.)
