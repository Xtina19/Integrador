package service;

import model.Actividad;
import model.Cliente;
import model.EstadoReserva;
import model.EstadoReservaIds;
import model.HorarioActividad;
import model.ReservaActividad;
import repository.ActividadRepository;
import repository.ClienteRepository;
import repository.EstadoReservaRepository;
import repository.HorarioActividadRepository;
import repository.ReservaActividadRepository;
import util.DateUtils;
import util.IdGenerator;
import validation.ValidationException;
import validation.Validators;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Reservas de actividades. Solo socios activos.
 */
public class ReservaActividadService {

    private final ReservaActividadRepository reservaRepository;
    private final ActividadRepository actividadRepository;
    private final ClienteRepository clienteRepository;
    private final HorarioActividadRepository horarioRepository;
    private final EstadoReservaRepository estadoRepository;
    private final AuditoriaService auditoriaService;

    private boolean ultimaAuditoriaFallida;

    public ReservaActividadService() {
        this(new ReservaActividadRepository(), new ActividadRepository(), new ClienteRepository(),
                new HorarioActividadRepository(), new EstadoReservaRepository(), new AuditoriaService());
    }

    public ReservaActividadService(ReservaActividadRepository reservaRepository,
                                   ActividadRepository actividadRepository,
                                   ClienteRepository clienteRepository,
                                   HorarioActividadRepository horarioRepository,
                                   EstadoReservaRepository estadoRepository,
                                   AuditoriaService auditoriaService) {
        this.reservaRepository = reservaRepository;
        this.actividadRepository = actividadRepository;
        this.clienteRepository = clienteRepository;
        this.horarioRepository = horarioRepository;
        this.estadoRepository = estadoRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<ReservaActividad> listar() {
        return reservaRepository.findAll();
    }

    public List<Actividad> listarActividades() {
        return actividadRepository.findAll();
    }

    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    public List<EstadoReserva> listarEstados() {
        return estadoRepository.findAll();
    }

    public List<HorarioActividad> listarHorariosPorActividadYFecha(Integer idActividad, LocalDate fecha) {
        List<HorarioActividad> base = horarioRepository.findByActividad(idActividad);
        if (fecha == null) {
            return base;
        }
        return base.stream()
                .filter(h -> DateUtils.mismoDiaSemana(fecha, h.getDiaActividad()))
                .toList();
    }

    public Optional<ReservaActividad> buscarPorId(Integer id) {
        return reservaRepository.findById(id);
    }

    public Optional<ReservaActividad> buscarPorId(String idTexto) {
        if (idTexto == null || idTexto.isBlank()) {
            return Optional.empty();
        }
        return buscarPorId(Validators.requireInteger("ID Reserva Actividad", idTexto));
    }

    public Optional<Actividad> buscarActividad(Integer id) {
        return actividadRepository.findById(id);
    }

    public Optional<Cliente> buscarCliente(Integer id) {
        return clienteRepository.findById(id);
    }

    public Optional<HorarioActividad> buscarHorario(String id) {
        return horarioRepository.findById(id);
    }

    public Optional<EstadoReserva> buscarEstado(String id) {
        return estadoRepository.findById(id);
    }

    public int sugerirSiguienteId() {
        return IdGenerator.nextIntFromExisting(
                reservaRepository.findAll().stream().map(ReservaActividad::getIdReservaActividad).toList());
    }

    public ReservaActividad guardar(ReservaActividad reserva, boolean esNuevo) {
        validar(reserva, esNuevo);
        Optional<ReservaActividad> existente = buscarPorId(reserva.getIdReservaActividad());

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Reserva Actividad",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            if (reserva.getIdEstadoReservaActividad() == null || reserva.getIdEstadoReservaActividad().isBlank()) {
                reserva.setIdEstadoReservaActividad(EstadoReservaIds.ACTIVA);
            }
            reserva.setFechaBaja(null);
            ReservaActividad creada = reservaRepository.insert(reserva);
            ultimaAuditoriaFallida = !auditoriaService.registrar(
                    "CREAR", "ReservaActividad", String.valueOf(creada.getIdReservaActividad()),
                    "Reserva de actividad creada.");
            return creada;
        }

        if (existente.isEmpty()) {
            throw new ValidationException("ID Reserva Actividad",
                    "no existe para modificar.");
        }
        ReservaActividad actual = existente.get();
        if (EstadoReservaIds.esTerminal(actual.getIdEstadoReservaActividad())) {
            throw new ValidationException("Reserva",
                    "no se puede modificar una reserva cancelada o reversada.");
        }
        // conservar fechaBaja (solo lectura)
        reserva.setFechaBaja(actual.getFechaBaja());
        ReservaActividad actualizada = reservaRepository.update(reserva);
        ultimaAuditoriaFallida = !auditoriaService.registrar(
                "MODIFICAR", "ReservaActividad", String.valueOf(actualizada.getIdReservaActividad()),
                "Reserva de actividad modificada.");
        return actualizada;
    }

    public ReservaActividad cancelar(Integer id, String motivo) {
        return cambiarEstado(id, EstadoReservaIds.CANCELADA, "CANCELAR", motivo, true);
    }

    public ReservaActividad reversar(Integer id, String motivo) {
        asegurarAdministrador("reversar reservas de actividad");
        return cambiarEstado(id, EstadoReservaIds.REVERSADA, "REVERSAR", motivo, true);
    }

    public void eliminar(Integer id) {
        asegurarAdministrador("eliminar reservas de actividad");
        if (id == null) {
            throw new ValidationException("ID Reserva Actividad", "es obligatorio.");
        }
        ReservaActividad actual = buscarPorId(id).orElseThrow(() ->
                new ValidationException("ID Reserva Actividad", "no existe."));

        if (EstadoReservaIds.bloqueaDisponibilidad(actual.getIdEstadoReservaActividad())) {
            throw new ValidationException("ID Reserva Actividad",
                    "no se puede eliminar una reserva activa. Cancélela primero.");
        }
        if (!EstadoReservaIds.permiteEliminacionFisica(actual.getIdEstadoReservaActividad())) {
            throw new ValidationException("ID Reserva Actividad",
                    "solo se pueden eliminar físicamente reservas canceladas o reversadas.");
        }
        reservaRepository.deleteById(String.valueOf(id));
        ultimaAuditoriaFallida = !auditoriaService.registrar(
                "ELIMINAR", "ReservaActividad", String.valueOf(id), "Eliminación física.");
    }

    public void validar(ReservaActividad reserva, boolean esNuevo) {
        if (reserva == null) {
            throw new ValidationException("Reserva actividad", "los datos son obligatorios.");
        }
        if (reserva.getIdReservaActividad() == null || reserva.getIdReservaActividad() <= 0) {
            throw new ValidationException("ID Reserva Actividad", "debe ser un entero mayor que cero.");
        }
        if (actividadRepository.findById(reserva.getIdActividad()).isEmpty()) {
            throw new ValidationException("Actividad", "debe existir.");
        }
        Cliente cliente = clienteRepository.findById(reserva.getIdClienteReservaActividad())
                .orElseThrow(() -> new ValidationException("Cliente", "debe existir."));
        if (!cliente.isActivo()) {
            throw new ValidationException("Cliente", "está inactivo. Solo clientes activos pueden reservar.");
        }
        if (!cliente.isSocio()) {
            throw new ValidationException("Cliente",
                    "debe ser socio activo. Los invitados no pueden reservar actividades.");
        }

        HorarioActividad horario = horarioRepository.findById(reserva.getIdHorarioActividad())
                .orElseThrow(() -> new ValidationException("Horario", "debe existir."));
        if (!horario.getIdActividad().equals(reserva.getIdActividad())) {
            throw new ValidationException("Horario",
                    "no pertenece a la actividad seleccionada.");
        }
        if (estadoRepository.findById(reserva.getIdEstadoReservaActividad()).isEmpty()) {
            throw new ValidationException("Estado", "debe existir.");
        }
        if (reserva.getFechaReserva() == null) {
            throw new ValidationException("Fecha", "es obligatoria.");
        }
        if (esNuevo && reserva.getFechaReserva().isBefore(DateUtils.today())) {
            throw new ValidationException("Fecha",
                    "no puede ser anterior a la fecha actual al crear.");
        }
        if (!DateUtils.mismoDiaSemana(reserva.getFechaReserva(), horario.getDiaActividad())) {
            throw new ValidationException("Fecha",
                    "el día (" + DateUtils.diaSemanaEspanol(reserva.getFechaReserva())
                            + ") no coincide con el horario (" + horario.getDiaActividad() + ").");
        }

        validarDuplicadoActivo(reserva);
        validarSolapamientoCliente(reserva, horario.getHoraActividad());
    }

    private void validarDuplicadoActivo(ReservaActividad reserva) {
        List<ReservaActividad> coincidencias = reservaRepository.findActivasDuplicadas(
                reserva.getIdClienteReservaActividad(),
                reserva.getIdActividad(),
                reserva.getFechaReserva(),
                reserva.getIdHorarioActividad());
        boolean conflicto = coincidencias.stream()
                .filter(r -> EstadoReservaIds.bloqueaDisponibilidad(r.getIdEstadoReservaActividad()))
                .anyMatch(r -> !r.getIdReservaActividad().equals(reserva.getIdReservaActividad()));
        if (conflicto) {
            throw new ValidationException("Reserva",
                    "ya existe una reserva activa para el mismo cliente, actividad, fecha y horario.");
        }
    }

    private void validarSolapamientoCliente(ReservaActividad reserva, LocalTime hora) {
        List<ReservaActividad> delCliente = reservaRepository.findByCliente(reserva.getIdClienteReservaActividad());
        for (ReservaActividad otra : delCliente) {
            if (otra.getIdReservaActividad().equals(reserva.getIdReservaActividad())) {
                continue;
            }
            if (!EstadoReservaIds.bloqueaDisponibilidad(otra.getIdEstadoReservaActividad())) {
                continue;
            }
            if (!reserva.getFechaReserva().equals(otra.getFechaReserva())) {
                continue;
            }
            HorarioActividad hOtra = horarioRepository.findById(otra.getIdHorarioActividad()).orElse(null);
            if (hOtra != null && hora != null && hora.equals(hOtra.getHoraActividad())) {
                throw new ValidationException("Horario",
                        "el cliente ya tiene otra reserva activa en la misma fecha y hora.");
            }
        }
    }

    private ReservaActividad cambiarEstado(Integer id, String nuevoEstado, String accion,
                                           String motivo, boolean setFechaBaja) {
        ReservaActividad actual = buscarPorId(id).orElseThrow(() ->
                new ValidationException("ID Reserva Actividad", "no existe."));

        if (EstadoReservaIds.esTerminal(actual.getIdEstadoReservaActividad())) {
            throw new ValidationException("Estado",
                    "la reserva ya está finalizada/cancelada/reversada.");
        }
        if (estadoRepository.findById(nuevoEstado).isEmpty()) {
            throw new ValidationException("Estado", "el estado destino no existe.");
        }

        String anterior = actual.getIdEstadoReservaActividad();
        actual.setIdEstadoReservaActividad(nuevoEstado);
        if (setFechaBaja) {
            actual.setFechaBaja(DateUtils.today());
        }
        ReservaActividad actualizada = reservaRepository.update(actual);
        String desc = "Estado " + anterior + " -> " + nuevoEstado
                + ". Fecha baja: " + DateUtils.format(actualizada.getFechaBaja())
                + (motivo == null || motivo.isBlank() ? "" : ". Motivo: " + motivo.trim());
        ultimaAuditoriaFallida = !auditoriaService.registrar(accion, "ReservaActividad",
                String.valueOf(id), desc);
        return actualizada;
    }

    private void asegurarAdministrador(String accion) {
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException("Acceso denegado. Solo el administrador puede " + accion + ".");
        }
    }

    public boolean isUltimaAuditoriaFallida() {
        return ultimaAuditoriaFallida;
    }
}
