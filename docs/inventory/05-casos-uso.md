# 05 — Casos de uso

Casos de uso **implementados** en Application Services / Handlers y expuestos por HTTP.

---

## 1. Consultas (solo lectura)

| Caso de uso | Servicio | Endpoint |
|-------------|----------|----------|
| Listar productos con existencias | `InventoryQueryService.listProductosVista` | `GET /productos` |
| Dashboard KPIs | `dashboardKpis` | `GET /dashboard` |
| Listar / obtener movimiento | `listMovimientos` / `getMovimiento` | `GET /movimientos`, `GET /movimientos/:id` |
| Kardex | `listKardex` | `GET /kardex?productoId=` |
| Auditoría + export | `listAuditorias` / `exportAuditoriasCsv` | `GET /auditoria`, `GET /auditoria/export` |

---

## 2. Transferencias

| Caso | Método App | HTTP | ¿Engine? |
|------|------------|------|----------|
| Crear | `crearTransferencia` (`solicitar?`) | `POST /transferencias` | No |
| Solicitar | `solicitarTransferencia` | `POST …/solicitar` | No |
| Cancelar | `cancelarTransferencia` | `POST …/cancelar` | No |
| Despachar | `despacharTransferencia` | `POST …/despachar` | **Sí** (salidas origen) |
| Recibir | `recibirTransferencia` | `POST …/recibir` | **Sí** (entradas destino) |
| Listar / detalle | `listarTransferencias` / `getTransferencia` | `GET` | No |

---

## 3. Ajustes

| Caso | Método | HTTP | ¿Engine? |
|------|--------|------|----------|
| Crear | `crearAjuste` | `POST /ajustes` | No |
| Solicitar / rechazar / cancelar | correspondientes | `POST …/solicitar\|rechazar\|cancelar` | No |
| Aprobar | `aprobarAjuste` | `POST …/aprobar` | No |
| Aplicar | `aplicarAjuste` | `POST …/aplicar` | **Sí** |
| Revertir | `revertirAjuste` | `POST …/revertir` | **Sí** |
| Listar / detalle | `listarAjustes` / `getAjuste` | `GET` | No |

---

## 4. Descartes

| Caso | Método / Handler | HTTP | ¿Engine? |
|------|------------------|------|----------|
| Crear completo (ERP) | `CreateDescarteHandler.execute` | `POST /descartes` (body con `motivoCodigo`+`lineas`+`sucursalId`) | No (borrador) |
| Crear legacy | `crearDescarte` | `POST /descartes` (contrato mínimo) | No (solicitado) |
| Evidencias | store `addEvidencia` | `POST …/evidencias` | No |
| Solicitar / aprobar / rechazar / cancelar | App Service | `POST …` | No |
| Aplicar / revertir | App Service | `POST …` | **Sí** |
| Listar / detalle | create-store + aggregate | `GET /descartes`, `GET /descartes/:id` | No |

---

## 5. Conteos

| Caso | Método / Handler | HTTP | ¿Engine? |
|------|------------------|------|----------|
| Crear completo | `CreateConteoHandler` → `crearConteoCompleto` | `POST /conteos` | No |
| Abrir | `abrirConteo` | `POST …/abrir` | No (sí bloquea almacén) |
| Registrar línea | `registrarLineaConteo` | `POST …/lineas/:lineaId` | No |
| Reconteo | `iniciarReconteo` | `POST …/reconteo` | No |
| Enviar revisión | `enviarConteoARevision` | `POST …/revision` | No |
| Clasificar | `clasificarLineaConteo` | `POST …/lineas/:lineaId/clasificar` | No |
| Cerrar | `cerrarConteo` | `POST …/cerrar` | No |
| Cancelar | `cancelarConteo` | `POST …/cancelar` | No |
| Listar / detalle | `listarConteos` / `getConteo` | `GET` | No |

Regularización: se realiza creando/aplicando **Ajuste** o **Descarte** vinculados a líneas; ahí sí interviene el Engine.

---

## 6. Outbox

| Caso | Endpoint |
|------|----------|
| Procesar eventos pendientes | `POST /outbox/process` |

---

## 7. Actores típicos (pruebas)

| Header `x-user-id` | Uso en demos |
|--------------------|--------------|
| `inventario` / `admin` | Operaciones generales (clientes FE) |
| Usuarios distintos | Aprobación de descarte (aprobador ≠ solicitante) |
