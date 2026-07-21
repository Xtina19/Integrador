# Reglas de negocio

## Autenticación y permisos

- Login con usuario registrado; sesión en `SessionContext`.
- Nivel 0 = administrador; nivel 1 = usuario normal.
- Solo administrador: mantenimiento/consulta de usuarios, generar cobro, reversar cobro, reversión/eliminación física de reservas.
- Usuarios autenticados: resto de mantenimientos, movimientos, consultas (excepto usuarios) y actualización de cuotas.

## Clientes

- Socios e invitados; solo socios activos pueden reservar.
- Balance y valor de cuota: reglas en `ClienteService` (balance no editable manualmente en UI de mantenimiento).
- Fecha de ingreso automática al crear.

## Reservas

- Solo socios activos.
- Cancelación: usuarios autenticados.
- Reversión / borrado físico: administrador; deja auditoría.
- Conflicto de disponibilidad según estado `ACT`.

## Cobros

- Generación mensual para socios activos con cuota positiva.
- ID típico: `COB-MM-AAAA-<idCliente>`.
- Evita duplicados del mismo período/cliente.
- Transacción por respaldo de archivos (`.txn.bak`) con rollback ante fallo.
- Genera volante PDF en `output/volantes/MM-AAAA/`.
- Reversión: elimina cobros no saldados del período y ajusta balance; no aplica a cobros saldados.

## Cuotas

1. Registrar cuota (encabezado pendiente + detalles planificados).
2. Actualizar cuota: aplica FIFO a cobros pendientes, reduce `valorCobro` y balance, marca cuota aplicada.
- No se puede registrar un monto mayor al balance del cliente.
- No reprocesar cuotas ya aplicadas en la misma fecha (según servicio).

## Consultas

- Solo lectura; filtrado en `ConsultaService`.
- FK faltante: texto `No encontrado (id)` + warning en log.
- Contraseñas nunca se exponen en consultas de usuarios.

## Validaciones transversales

- Fechas `dd/MM/yyyy`; rangos: inicial ≤ final.
- Montos no negativos donde aplique; dos decimales.
- Eliminación bloqueada si existen referencias (reservas, cobros, cuotas).
