# Centro de Actividades

Sistema de escritorio para administrar un centro de actividades o gimnasio.
Proyecto final de Programación II — almacenamiento en archivos TXT (sin base de datos).

## Tecnologías

- Java 17+
- Maven
- Java Swing (UI)
- OpenPDF (volantes PDF — FASE 6)
- JUnit 5

## Requisitos

- JDK 17 o superior
- Maven 3.9+ (o usar el Maven Wrapper / `.tools`)

Si no tienes JDK en el PATH, puedes usar el JDK portable en `.tools/jdk-17` (si fue descargado).

## Compilar y probar

```bash
cd centro-actividades
mvn test
mvn package
```

En Windows con herramientas portables:

```powershell
.\scripts\build.ps1 test
.\scripts\build.ps1 package
```

## Ejecutar

```bash
cd centro-actividades
mvn exec:java -Dexec.mainClass="app.Main"
# o
java -jar target/centro-actividades-1.0.0.jar
```

## Usuarios iniciales

| Login | Contraseña | Nivel |
|-------|------------|-------|
| `admin` | `admin123` | 0 Administrador |
| `usuario` | `usuario123` | 1 Usuario normal |

## Ubicación de datos

- Archivos TXT: `data/`
- Volantes PDF: `output/volantes/MM-AAAA/`
- Logs: `logs/`

## Estado del desarrollo

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Estructura, modelos, TXT, datos iniciales | Completada |
| 2 | Login y menú principal | Completada |
| 3 | Mantenimientos: Usuarios, Entrenadores, Localizaciones, Estados | Completada |
| 4 | Mantenimientos: Salas, Actividades, Horarios, Clientes | Completada |
| 5 | Reservas de salas y reservas de actividades | Completada |
| 6 | Cobros, cuotas, volantes PDF | Completada |
| 7 | Consultas y exportación CSV | Completada |
| 8 | Docs finales y empaquetado | Pendiente |

### Flujo de cobros/cuotas (FASE 6)

1. **Procesos → Generar cobro**: crea cobros de socios activos + PDF en `output/volantes/MM-AAAA/`.
2. **Movimientos → Cuotas**: registra el pago (encabezado + distribución planificada, status pendiente).
3. **Procesos → Actualizar cuota**: aplica el pago FIFO a cobros, actualiza balances y marca cuota aplicada.
4. **Procesos → Reversar cobro**: elimina cobros del período (no saldados), ajusta balance y borra PDF.

### Consultas (FASE 7)

Todas las opciones del menú **Consultas** abren ventanas de solo lectura con filtros, tabla ordenable, resumen y exportación CSV.
La lógica de filtrado vive en `ConsultaService` (la UI no lee archivos ni filtra en memoria de negocio).

| Consulta | Permiso | Filtros principales |
|----------|---------|---------------------|
| Usuarios | Solo administrador | Login, nombre, apellido, nivel, correo |
| Entrenadores | Autenticado | ID, nombre, apellido, teléfono, correo |
| Localizaciones | Autenticado | ID, tipo |
| Salas | Autenticado | ID, nombre, localización |
| Actividades | Autenticado | ID, nombre, entrenador, localización |
| Horarios | Autenticado | ID, día, hora (`HH:mm`), actividad |
| Cobros por rango | Autenticado | Fechas, cliente, estado, mes, año |
| Cobros por cliente | Autenticado | Cliente (obligatorio), estado, fechas |
| Cuotas por fecha | Autenticado | Fecha, estado, cliente + detalle al seleccionar |
| Cuotas por cliente | Autenticado | Cliente, fechas, estado + detalle al seleccionar |
| Clientes | Autenticado | ID, nombre, apellido, tipo, estado, correo, ingreso |
| Clientes con balance | Autenticado | ID, nombre, balance mínimo, solo activos, tipo |

**Notas de cobros:** la columna *Valor pendiente* usa `valorCobro`, que representa el **saldo pendiente** del cobro (decisión FASE 6), no el monto original facturado. No existe estado “Reversado” en el modelo de cobro (la reversión elimina el registro).

**FK faltantes:** si una relación no existe, la consulta muestra `No encontrado (id)` y registra advertencia en el log.

### Exportación CSV

- Utilidad: `util.CsvUtils` (UTF-8, separador coma `,`).
- Exporta **filas y columnas visibles** de la tabla (respeta el orden del sorter).
- Escapa comas, punto y coma, comillas y saltos de línea.
- Fechas `dd/MM/yyyy`, horas `HH:mm`, montos con dos decimales.
- Selector de archivo con extensión `.csv` automática y confirmación al sobrescribir.
- En consultas de cuotas: exportar encabezados, detalles, o CSV combinado con secciones `ENCABEZADOS` / `DETALLES_CUOTA_SELECCIONADA`.

### Decisiones técnicas

- **Hora:** `LocalTime` interno, TXT como `HH:mm`.
- **Estados reserva:** catálogo `ACT/CAN/REV/FIN` (`EstadoReservaIds`). Solo `ACT` bloquea disponibilidad.
- **Reservas:** solo socios activos. Invitados no pueden reservar.
- **Salas ↔ horarios:** el modelo no relaciona sala con actividad; los horarios de reserva de sala se filtran por día de la semana y se muestran como `ID - Actividad - Día - Hora`.
- **Auditoría:** append en `data/auditoria.txt`; si falla, la operación principal continúa con advertencia.
- **Reversión/eliminación física:** solo administrador. Cancelación disponible para usuarios autenticados.
- **Consultas:** `ConsultaBaseFrame` + frames en `ui/consulta/`; filtros reutilizados vía `ConsultaFilterSupport`.
- **Estado de cliente:** el modelo muestra *Activo* / *Pasivo* (`statusCliente`).

Documentación detallada (`docs/`) se completará en la FASE 8.
)
