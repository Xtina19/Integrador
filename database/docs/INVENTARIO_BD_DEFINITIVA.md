# Base de Datos Definitiva — Módulo Inventario (INV-DB-1.0.0)

**Fecha:** 2026-07-18  
**Versión de esquema:** `INV-DB-1.0.0`  
**Alcance:** únicamente Inventario. Sin cambios de dominio TypeScript, Engine ni Application Services. Sin Ventas/Compras/Importaciones nuevas.

---

## 1. Objetivo

Convertir el esquema MySQL del módulo Inventario en un modelo **listo para producción**, alineado al dominio DDD aprobado, eliminando estructuras redundantes/transicionales (`conteo_fisico_sesion`, `ajuste_inventario`, `descarte_aprobacion`, dualidad legado vs DDD).

---

## 2. Modelo físico final

### 2.1 Diagrama lógico (resumen)

```
categorias / editoriales / productos / sucursales / almacenes / usuarios
        │
        ├── inventario (Existencia: producto × almacén + version + bloqueo)
        ├── movimiento_inventario (ledger / Kardex físico)
        ├── auditoria_inventario
        ├── inventario_idempotencia
        │
        ├── transferencia + detalle_transferencia
        ├── ajuste + ajuste_detalle
        ├── conteo_fisico + alcance + snapshot + linea_conteo + auditoria_conteo_fisico
        └── descarte + descarte_detalle + descarte_evidencia
              └── orígenes: conteo / ajuste / transferencia / movimiento / kardex

cat_motivo_descarte · cat_motivo_ajuste · cat_clasificacion_conteo
inventario_schema_version
```

### 2.2 Convención de identificadores

| Capa | Identificador |
|------|----------------|
| MySQL / ERP | `INT UNSIGNED AUTO_INCREMENT` + FKs enteras |
| Dominio / Application Services | `dominio_id CHAR(36) NULL UNIQUE` en documentos y existencias |

Esto mantiene integridad referencial con el ERP y permite mapear UUIDs del backend sin romper contratos.

### 2.3 Dinero

`productos.costo` y `productos.precio`, y costos de descarte: **`DECIMAL(18,0)`** — pesos dominicanos **sin centavos**.

### 2.4 Existencia

Tabla física `inventario` (= agregado Existencia):

| Columna | Rol |
|---------|-----|
| `(producto_id, almacen_id)` UNIQUE | Stock atómico |
| `stock` | Saldo (dominio) |
| `version` | Concurrencia optimista |
| `bloqueado_por_conteo` / `conteo_bloqueante_id` | Bloqueo por conteo |
| `dominio_id` | Puente UUID |

### 2.5 Movimientos / Kardex

Una sola tabla ledger: `movimiento_inventario`.  
Kardex = proyección (`v_inv_kardex` / `v_kardex_documento`), no segunda tabla de hechos.

Tipos ENUM alineados a `TipoMovimiento`:

`transferencia_salida | transferencia_entrada | descarte | ajuste | recepcion | venta | devolucion_entrada | compensacion`

Columnas clave: `saldo_anterior`, `saldo_posterior`, `sentido`, `idempotency_key`, `documento_*`, `motivo_codigo`, `movimiento_compensa_id`, `dominio_id`.

### 2.6 Documentos

| Documento | Estados (dominio) |
|-----------|-------------------|
| Transferencia | borrador → solicitada → en_transito → recibida_parcial \| recibida (+ cancelada) |
| Ajuste | borrador \| solicitado \| aprobado \| rechazado \| aplicado \| cancelado \| revertido |
| Descarte | igual que Ajuste |
| Conteo | borrador \| abierto \| en_conteo \| en_revision \| cerrado \| cancelado |

---

## 3. Paquete de scripts (versionado)

Ubicación: `database/mysql/inventario_definitivo/`

| Script | Contenido |
|--------|-----------|
| `00_VERSION.sql` | `inventario_schema_version` |
| `01_cleanup_redundante.sql` | DROP tablas temporales/redundantes |
| `02_catalogos.sql` | Motivos / clasificaciones |
| `03_existencias_movimientos.sql` | ALTER productos, inventario, almacenes, movimientos |
| `04_transferencias.sql` | Estados y columnas dominio |
| `05_ajustes.sql` | `ajuste` + `ajuste_detalle` |
| `06_conteos.sql` | Conteo definitivo (sin “sesión”) |
| `07_descartes.sql` | Descarte definitivo + orígenes |
| `08_auditoria_idempotencia.sql` | Auditoría Inventario + idempotencia |
| `09_funciones.sql` | Funciones reutilizables |
| `10_procedimientos.sql` | SPs de todos los casos de uso |
| `11_triggers.sql` | Triggers de valor (estado stock + audit estados) |
| `12_vistas_indices.sql` | Vistas operativas/reportes + índices |
| `13_seed_joselito.sql` | Seeder profesional Joselito |
| `install.sql` | Instalador local del paquete |

Instaladores:

- `database/mysql/install_inventario_definitivo.sql`
- `database/mysql/install_all.sql` → incluye el paquete definitivo (sustituye 22–26)

Archivo histórico: `database/mysql/archive/` + stubs **DEPRECATED** de 22–26 en `database/mysql/`.

---

## 4. Cambios realizados (justificación)

| Cambio | Justificación técnica |
|--------|------------------------|
| Eliminar `conteo_fisico` legado (18) y `conteo_fisico_sesion` (22) | Dualidad de modelos; nombre “sesión” incorrecto para documento |
| Eliminar `ajuste_inventario` | No soporta estados/líneas del agregado Ajuste |
| Eliminar `descarte_aprobacion` | Fuente de verdad dual; aprobador vive en cabecera como en dominio |
| Renombrar/recrear `conteo_fisico` definitivo | Documento único alineado a `ConteoFisico.ts` |
| Transferencia: quitar `aprobada`/`finalizada` | No existen en dominio aprobado |
| `cantidad_enviada` → `cantidad_despachada` + faltante/dañada | Semántica de recepción parcial del agregado |
| DOP `DECIMAL(18,0)` | Política Joselito: sin centavos |
| `dominio_id` en documentos | Compatibilidad Application Services sin romper FKs INT |
| Ledger único + vista Kardex | Evita doble escritura / tablas huérfanas |
| `auditoria_inventario` | Espejo SQL de `AuditoriaMovimiento` del Engine |
| `inventario_idempotencia` | Replay-safe de operaciones que mueven stock |
| Orígenes tipados en descarte | Preparación de integraciones futuras sin cambiar dominio TS |
| Triggers solo en estado_stock y audit de cambio de estado | Evitar doble aplicación de stock (SPs son la vía mutadora) |

---

## 5. Tablas nuevas

- `inventario_schema_version`
- `cat_motivo_descarte`, `cat_motivo_ajuste`, `cat_clasificacion_conteo`
- `ajuste`, `ajuste_detalle`
- `conteo_fisico`, `conteo_alcance_producto`, `snapshot_conteo`, `linea_conteo`, `auditoria_conteo_fisico`
- `descarte`, `descarte_detalle`, `descarte_evidencia`
- `auditoria_inventario`, `inventario_idempotencia`

---

## 6. Tablas modificadas

| Tabla | Modificación |
|-------|--------------|
| `productos` | costo/precio → DECIMAL(18,0) |
| `inventario` | version, bloqueo, dominio_id |
| `almacenes` | bloqueo por conteo |
| `movimiento_inventario` | tipos dominio, saldo_anterior, sentido, idempotency, documento_*, dominio_id |
| `transferencia` | estados dominio, version, dominio_id |
| `detalle_transferencia` | despachada/faltante/dañada + CHECK |

---

## 7. Tablas eliminadas (redundantes/temporales)

- `detalle_conteo_fisico`, `conteo_fisico` (legado 18)
- `conteo_fisico_sesion` (+ satélites previos recreados definitivos)
- `ajuste_inventario`
- `descarte_sesion`, `descarte_aprobacion` (y versiones UUID previas recreadas)

---

## 8. Índices creados (principales)

- Existencias: `(producto_id, almacen_id)`, `bloqueado_por_conteo`
- Movimientos: `(fecha_movimiento, tipo_movimiento)`, `(documento_tipo, documento_id)`, `idempotency_key` UNIQUE, `dominio_id` UNIQUE
- Documentos: `(almacen_id, estado)`, códigos UNIQUE, `dominio_id` UNIQUE
- Reportes: compuestos en `12_vistas_indices.sql` sobre auditorías y documentos activos
- Descarte orígenes: índices por `*_origen_id`

---

## 9. Funciones SQL

| Función | Uso |
|---------|-----|
| `fn_inv_estado_stock(stock, minimo)` | normal / bajo / agotado |
| `fn_inv_sentido_movimiento(tipo)` | entrada / salida según TipoMovimiento |
| `fn_inv_valor_existencia(producto_id, almacen_id)` | stock × costo |
| `fn_inv_uuid()` | UUID para `dominio_id` |

---

## 10. Procedimientos almacenados (casos de uso)

**Núcleo**

- `sp_inv_registrar_movimiento` — mutación de stock + ledger + auditoría (+ idempotencia)
- `sp_actualizar_inventario` — recreado para compatibilidad con triggers de Ventas/Recepciones existentes

**Transferencias:** crear, solicitar, despachar, recibir, cancelar  

**Ajustes:** crear, solicitar, rechazar, cancelar, aprobar, aplicar, revertir  

**Descartes:** crear, solicitar, rechazar, cancelar, aprobar, aplicar, revertir  

**Conteos:** crear, abrir, registrar línea, enviar revisión, clasificar línea, cerrar, cancelar  

---

## 11. Triggers

| Trigger | Justificación |
|---------|----------------|
| `trg_inventario_estado_stock` (+ insert) | Deriva `estado_stock` automáticamente |
| `trg_ajuste_audit_estado` | Auditoría al cambiar estado |
| `trg_transferencia_audit_estado` | Idem |
| `trg_descarte_audit_estado` | Idem |
| `trg_conteo_audit_estado` | Idem |

No hay triggers que vuelvan a mover stock si el SP ya lo hizo.

---

## 12. Vistas

| Vista | Propósito |
|-------|-----------|
| `v_inv_existencias` | Inventario general / valoración |
| `v_inv_kardex` | Kardex con documento origen |
| `v_inv_auditoria` | Auditoría operativa Inventario |
| `v_inv_transferencias_activas` | Pipeline transferencias |
| `v_inv_conteos_abiertos` | Conteos en curso |
| `v_inv_ajustes_pendientes` | Ajustes pendientes |
| `v_inv_descartes_pendientes` | Descartes pendientes |
| `v_inv_dashboard_kpis` | KPIs operativos |

Alias de compatibilidad: `v_inventario_existencias`, `v_kardex_documento`, `v_auditoria_inventario`.

---

## 13. Seeder Joselito (`13_seed_joselito.sql`)

- Moneda DOP, costos/precios **enteros** (costos en {650, 895, 1200, 1500, 2500, 3500})
- Categorías reales: Literatura, Infantil, Texto escolar, Referencia, Papelería
- Editoriales reales: Penguin Random House, Planeta, Alfaguara, SM, Norma, Santillana, Ediciones UASD, Larousse, etc.
- ~47 productos `JSL-*` con autores/títulos reales
- Existencias coherentes por almacén
- Documentos de ejemplo generados vía **stored procedures** (transferencias, ajustes, descartes, conteos → movimientos/kardex/auditoría)
- Idempotente (`WHERE NOT EXISTS` / códigos únicos / idempotency keys)

---

## 14. Cómo instalar

```bash
cd database/mysql
mysql -u root -p < install_all.sql
```

Solo Inventario definitivo (base 01–21 ya instalada):

```bash
cd database/mysql
mysql -u root -p librosys < install_inventario_definitivo.sql
```

---

## 15. Compatibilidad

| Capa | Estado |
|------|--------|
| Dominio TypeScript | **Sin cambios** |
| Inventory Engine | **Sin cambios** |
| Application Services | **Sin cambios** (puente `dominio_id`) |
| Módulo Inventario funcional | **Cerrado** — esta fase solo BD |

---

## 16. Limitaciones / notas de revisión

1. El paquete está pensado para ejecutarse **una vez** tras `01`–`21` (ALTER sin `IF NOT EXISTS` en columnas).
2. No se ejecutó contra un servidor MySQL en este entorno; validación pendiente en instalación real.
3. Kardex no es tabla física; `kardex_origen_id` en descarte es referencia lógica al movimiento/ledger.
4. Scripts 22–26 quedan DEPRECATED/archivados; no deben ejecutarse junto al pack definitivo.

---

## 17. Detención

Base de Datos Definitiva de Inventario entregada para **revisión**.  
No se agregaron funcionalidades al módulo Inventario ni se iniciaron otros módulos.
