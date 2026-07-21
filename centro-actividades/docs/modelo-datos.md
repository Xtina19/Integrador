# Modelo de datos

Persistencia en archivos TXT UTF-8 bajo `data/`, separador de campos `|`. Escritura atómica mediante archivo temporal (`.tmp`) y reemplazo.

## Archivos

| Archivo | Entidad | Clave |
|---------|---------|-------|
| `usuarios.txt` | Usuario | `loginUsuario` |
| `entrenadores.txt` | Entrenador | `idEntrenador` |
| `localizaciones.txt` | Localizacion | `idLocalizacion` |
| `salas.txt` | Sala | `idSala` |
| `actividades.txt` | Actividad | `idActividad` |
| `horarios_actividades.txt` | HorarioActividad | `idHorarioActividad` |
| `estados_reserva.txt` | EstadoReserva | `idEstado` |
| `clientes.txt` | Cliente | `idCliente` |
| `reservas.txt` | Reserva (sala) | `idReserva` |
| `reservas_actividades.txt` | ReservaActividad | `idReservaActividad` |
| `cobros.txt` | Cobro | `idCobro` |
| `encabezado_cuotas.txt` | EncabezadoCuota | `idCuota` |
| `detalle_cuotas.txt` | DetalleCuota | `idCuota` + `secuenciaCuota` |
| `auditoria.txt` | Auditoría (append) | — |

## Formatos

- **Fecha:** `dd/MM/yyyy`
- **Fecha-hora:** `dd/MM/yyyy HH:mm:ss`
- **Hora:** `HH:mm` (`LocalTime`)
- **Dinero:** dos decimales, punto decimal (`Locale.US` en almacenamiento)
- **Booleanos:** según mapper de cada entidad (`true`/`false` o equivalente del proyecto)

## Relaciones principales

```
Localizacion 1──* Sala
Localizacion 1──* Actividad
Entrenador   1──* Actividad
Actividad    1──* HorarioActividad
Cliente      1──* Reserva / ReservaActividad / Cobro / EncabezadoCuota
EncabezadoCuota 1──* DetalleCuota → Cobro
Sala / HorarioActividad ← Reserva
HorarioActividad ← ReservaActividad
```

## Decisiones relevantes

- `Cobro.valorCobro` = **saldo pendiente** del cobro (no el monto original facturado).
- `Cliente.statusCliente`: activo / pasivo. `tipoCliente`: 1 socio, 2 invitado.
- Estados de reserva: `ACT`, `CAN`, `REV`, `FIN`. Solo `ACT` bloquea disponibilidad.
- No hay base de datos relacional; la integridad referencial se valida en servicios.
