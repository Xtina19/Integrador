# 06 — Flujos operativos

Diagramas de los flujos **realmente implementados**.

---

## 1. Transferencia entre almacenes

```mermaid
stateDiagram-v2
  [*] --> borrador: crear(solicitar=false)
  [*] --> solicitada: crear(default)
  borrador --> solicitada: solicitar
  borrador --> cancelada: cancelar
  solicitada --> cancelada: cancelar
  solicitada --> en_transito: despachar\n(Engine salida origen)
  en_transito --> recibida_parcial: recibir parcial\n(Engine entrada destino)
  en_transito --> recibida: recibir completa
  recibida_parcial --> recibida: recibir resto
  recibida_parcial --> recibida_parcial: recibir parcial
```

**Pantallas:**  
`/inventario/transferencias/nuevo` → `/inventario/transferencias/:id` → `/inventario/transferencias/:id/recepcion`

---

## 2. Ajuste de inventario

```mermaid
stateDiagram-v2
  [*] --> borrador: crear(solicitar=false)
  [*] --> solicitado: crear(default)
  borrador --> solicitado: solicitar
  borrador --> cancelado: cancelar
  solicitado --> cancelado: cancelar
  solicitado --> rechazado: rechazar
  solicitado --> aprobado: aprobar
  aprobado --> aplicado: aplicar (Engine)
  aplicado --> revertido: revertir (Engine)
```

**Pantallas:** `/inventario/ajustes/nuevo` → `/inventario/ajustes/:id`

---

## 3. Descarte

Igual que ajuste en estados. Diferencias:

- Flujo ERP completo nace en **borrador** (`CreateDescarteHandler`).
- Evidencias antes de solicitar.
- Aprobador distinto del solicitante.
- Aplicar genera movimiento tipo `descarte`.

**Pantallas:** `/inventario/descartes/nuevo` → `/inventario/descartes/:id`

---

## 4. Conteo físico (ciclo completo)

```mermaid
flowchart LR
  A[Crear borrador] --> B[Abrir\nsnapshot + bloqueo]
  B --> C[Captura]
  C --> D{¿Reconteo?}
  D -->|sí| E[Reconteo]
  E --> C
  D -->|no| F[Enviar revisión]
  F --> G[Clasificar]
  G --> H[Regularizar\nAjuste/Descarte + Aplicar]
  H --> I[Cerrar\nlibera bloqueo]
```

**Pantallas por fase:**

| Fase | Ruta |
|------|------|
| Crear | `/inventario/conteos/nuevo` |
| Gestión | `/inventario/conteos/:id` |
| Captura | `…/captura` |
| Reconteo | `…/reconteo` |
| Revisión | `…/revision` |
| Clasificación | `…/clasificacion` |
| Regularización | `…/regularizacion` |

Durante `abierto`/`en_conteo`/`en_revision` el almacén puede quedar bloqueado para otros movimientos (salvo bypass del propio conteo al aplicar regularizaciones).

---

## 5. Movimiento → Kardex → Documento

```mermaid
sequenceDiagram
  participant U as Usuario/UI
  participant API as /api/inventario
  participant AS as ApplicationService
  participant E as InventoryEngine
  participant S as Existencia+Ledger

  U->>API: POST despachar/aplicar/…
  API->>AS: comando + expectedVersion + idempotencyKey
  AS->>E: comando tipado
  E->>S: muta saldo + movimiento + kardex + auditoría
  AS-->>API: resultado
  API-->>U: 200/201
  U->>API: GET /kardex o /movimientos/:id
  U->>U: navega a documento origen
```

---

## 6. Lectura operativa diaria

1. Abrir `/inventario` (dashboard + tab General).  
2. Revisar KPIs (`GET /dashboard`).  
3. Explorar movimientos/kardex.  
4. Atender transferencias/conteos/ajustes/descartes pendientes desde sus tabs.  
5. Auditar con filtros y exportar si se requiere.
