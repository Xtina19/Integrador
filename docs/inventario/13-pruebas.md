# 13 — Pruebas

Registro de lo **implementado y verificado** en el cierre del módulo Inventario.

---

## 1. Pruebas automatizadas (backend)

**Ubicación:** `backend/src/modules/inventario/**/*.test.ts`  
**Runner:** Vitest

### Cobertura típica

| Área | Archivos / foco |
|------|-----------------|
| Domain Engine | `domain/services/InventoryEngine.test.ts` |
| Application Services | `application/services/ApplicationServices.test.ts` |
| Handlers Create | `CreateConteoHandler.test.ts`, `CreateDescarteHandler.test.ts` |
| HTTP | `infrastructure/api/http/controllers.http.test.ts` |
| Persistencia | `persistence.integration.test.ts` |
| Observability | `observability.test.ts` |
| Seeder Joselito | `composition/seedJoselito.test.ts` |

### Resultado de cierre reportado

- **9** archivos de test del módulo  
- **69** tests pasando  

Comando:

```bash
cd backend
npx vitest run src/modules/inventario
```

---

## 2. Build frontend

```bash
cd Frontend
npm run build
```

Cierre reportado: build de producción OK (TypeScript + Vite).

---

## 3. Pruebas funcionales manuales recomendadas

Usar UI `/inventario` con API montada y headers de admin.

### Checklist Transferencias

1. Crear borrador → solicitar → despachar → recibir parcial → completar.  
2. Cancelar desde borrador/solicitada.  
3. Verificar movimientos/kardex en origen y destino.  
4. Confirmar `version` / rechazo con `expectedVersion` viejo.

### Checklist Ajustes / Descartes

1. Crear → solicitar → aprobar (descarte: otro usuario) → aplicar.  
2. Revertir aplicado; ver compensación en ledger.  
3. Adjuntar evidencia en descarte borrador.  
4. Rechazar / cancelar caminos negativos.

### Checklist Conteos

1. Crear con alcance de productos.  
2. Abrir (bloqueo almacén).  
3. Capturar todas las líneas → revisión.  
4. Clasificar; regularizar diferencias con ajuste/descarte aplicados.  
5. Cerrar; verificar desbloqueo.  
6. Cancelar un borrador/abierto y verificar desbloqueo.

### Checklist Consultas

1. Dashboard KPIs coherentes con datos.  
2. Kardex navega a documento origen.  
3. Auditoría filtra y exporta CSV.  
4. Ficha de producto muestra stock por almacén.

### Checklist Seeder

1. Arranque en frío: catálogo Joselito visible.  
2. Reinicio con snapshot: no duplica productos (idempotencia).

---

## 4. Pruebas de base de datos

Validación del pack **INV-DB-1.0.0** (pendiente de ejecución en cada entorno):

```bash
cd database/mysql
mysql -u root -p < install_all.sql
```

Verificar:

- `SELECT * FROM inventario_schema_version;`
- Existencia de `sp_inv_registrar_movimiento`, vistas `v_inv_*`
- Seed `JSL-001`… y documentos `JSL-TRF-*`
- Constraints: intentar stock negativo / transferencia mismo almacén debe fallar

---

## 5. Limitaciones conocidas de prueba

- Costeo UI no tiene endpoint de dominio (solo `localStorage`).
- Runtime Node y MySQL son dos vías de persistencia; no mezclar mutaciones concurrentes sin adaptador único.
- Scripts SQL no se ejecutaron necesariamente en el mismo entorno donde corren los 69 tests Node.
