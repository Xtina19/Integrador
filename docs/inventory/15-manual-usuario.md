# 15 — Manual de usuario (Inventario)

Manual operativo para usuarios de **LibroSys / Librería Joselito**. Describe las pantallas y procesos **implementados** en el módulo Inventario.

---

## 1. Acceso

1. Inicie sesión en LibroSys.
2. En el menú lateral, seleccione **Inventario**.
3. Verá el panel con indicadores y las pestañas del módulo.

> Transferencias **no** aparecen como menú aparte: se gestionan dentro de Inventario → pestaña **Transferencias**.

---

## 2. Pantalla principal

### Indicadores (dashboard)

Resumen de productos, existencias, pendientes de transferencias/ajustes/descartes, conteos activos y movimiento reciente.

### Pestañas

| Pestaña | Para qué sirve |
|---------|----------------|
| General | Catálogo y stock por almacén |
| Movimientos | Historial de entradas/salidas |
| Transferencias | Envíos entre almacenes |
| Conteos | Inventarios físicos |
| Ajustes | Correcciones de cantidad |
| Descartes | Bajas (daño, pérdida, etc.) |
| Kardex | Historial por producto |
| Auditoría | Quién hizo qué y cuándo |

Botones superiores: **Nuevo producto**, **Nueva transferencia**, **Crear conteo**, **Nuevo descarte**, **Nuevo ajuste**, **Costeo**.

---

## 3. Consultar un producto

1. Pestaña **General**.
2. Ubique el título/ISBN.
3. Abra **Ficha** para ver stock por almacén.
4. Desde ahí puede ir al **Kardex** o al último movimiento.

---

## 4. Transferir mercadería entre almacenes

### Crear

1. **Nueva transferencia**.
2. Elija almacén origen y destino (deben ser distintos).
3. Agregue productos y cantidades enteras.
4. Guarde (borrador o solicitada, según el formulario).

### Avanzar el proceso

En el **detalle** de la transferencia:

| Estado actual | Acción disponible |
|---------------|-------------------|
| Borrador | Solicitar o Cancelar |
| Solicitada | Despachar o Cancelar |
| En tránsito / Recepción parcial | Registrar recepción |
| Recibida | Proceso terminado |

Al **despachar**, el sistema descuenta del origen.  
Al **recibir**, suma en el destino (puede ser parcial: indique faltantes o dañados).

---

## 5. Realizar un conteo físico

1. **Crear conteo**: nombre, almacén, tipo, alcance de productos.
2. En el detalle, **Abrir** el conteo (el sistema toma la foto de existencias y puede bloquear el almacén).
3. **Captura**: registre cantidades contadas.
4. Si hay dudas, use **Reconteo**.
5. Envíe a **Revisión**.
6. **Clasifique** diferencias (cuadra, sobrante, faltante, daño, investigación).
7. **Regularice** faltantes/sobrantes con un **ajuste** o **descarte** aplicado.
8. **Cierre** el conteo (solo si no quedan diferencias sin regularizar).

Para anular un conteo recién creado o recién abierto: use **Cancelar** (libera el bloqueo del almacén).

---

## 6. Ajustar inventario

1. **Nuevo ajuste**: almacén, tipo, productos, cantidad objetivo o diferencia, motivo.
2. Envíe a solicitud si quedó en borrador.
3. Un responsable **aprueba**.
4. **Aplicar** hace efectivo el cambio de stock.
5. Si hubo error, puede **Revertir** un ajuste ya aplicado (queda trazado en movimientos/auditoría).

También puede **Rechazar** o **Cancelar** según el estado.

---

## 7. Registrar un descarte

1. **Nuevo descarte**: almacén, motivo tipificado, productos, cantidades, observaciones.
2. Adjunte **evidencias** (foto, acta, comentario) mientras esté en borrador.
3. **Solicitar** aprobación.
4. Otro usuario (distinto del solicitante) **aprueba** o **rechaza**.
5. **Aplicar** descuenta el stock.
6. Si corresponde, **Revertir** restaura con movimiento de compensación.

---

## 8. Kardex y movimientos

- **Movimientos**: lista cronológica; abra un movimiento para ver cantidades y documento origen.
- **Kardex**: filtre por producto; cada línea debe permitir ir al documento que la originó (transferencia, ajuste, descarte, etc.).

---

## 9. Auditoría

1. Pestaña **Auditoría**.
2. Filtre por usuario, documento, acción, resultado y fechas (e IP si está disponible).
3. Use **Exportar** para obtener CSV/JSON.
4. Abra un registro para el detalle.

---

## 10. Costeo

La pantalla **Costeo** permite registrar información de costos en la interfaz. En la versión actual la persistencia es **provisional** (almacenamiento local del navegador); no forma parte del motor de inventario. Consulte a sistemas si requiere costeo contable definitivo.

---

## 11. Buenas prácticas Joselito

- Use siempre cantidades **enteras** (sin decimales).
- Costos/precios en **pesos dominicanos sin centavos**.
- No fuerce operaciones en un almacén con **conteo abierto** (el sistema puede bloquearlas).
- Para descartes, prepare evidencia antes de solicitar aprobación.
- Verifique el **Kardex** después de despachos, recepciones, ajustes y descartes aplicados.

---

## 12. Glosario breve

| Término | Significado |
|---------|-------------|
| Existencia | Cantidad de un producto en un almacén |
| Ledger / Movimiento | Registro inmutable de un cambio de stock |
| Kardex | Historial de movimientos de un producto |
| Engine | Motor interno que aplica cambios de stock de forma segura |
| Regularización | Ajuste o descarte que corrige una diferencia de conteo |
