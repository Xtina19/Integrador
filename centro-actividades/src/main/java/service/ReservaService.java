package service;

import model.Cliente;
import model.EstadoReserva;
import model.EstadoReservaIds;
import model.HorarioActividad;
import model.Reserva;
import model.Sala;
import repository.ClienteRepository;
import repository.EstadoReservaRepository;
import repository.HorarioActividadRepository;
import repository.ReservaRepository;
import repository.SalaRepository;
import util.DateUtils;
import validation.ValidationException;
import validation.Validators;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Reservas de salas.
 * <p>
 * Limitación del modelo: el horario pertenece a una actividad, no a una sala.
 * Por eso se listan horarios filtrados por día de la semana (no por sala).
 * Solo socios activos pueden reservar.
 */
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final SalaRepository salaRepository;
    private final ClienteRepository clienteRepository;
    private final HorarioActividadRepository horarioRepository;
    private final EstadoReservaRepository estadoRepository;
    private final AuditoriaService auditoriaService;

    public ReservaService() {
        this(new ReservaRepository(), new SalaRepository(), new ClienteRepository(),
                new HorarioActividadRepository(), new EstadoReservaRepository(), new AuditoriaService());
    }

    public ReservaService(ReservaRepository reservaRepository,
                          SalaRepository salaRepository,
                          ClienteRepository clienteRepository,
                          HorarioActividadRepository horarioRepository,
                          EstadoReservaRepository estadoRepository,
                          AuditoriaService auditoriaService) {
        this.reservaRepository = reservaRepository;
        this.salaRepository = salaRepository;
        this.clienteRepository = clienteRepository;
        this.horarioRepository = horarioRepository;
        this.estadoRepository = estadoRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<Reserva> listar() {
        return reservaRepository.findAll();
    }

    public List<Sala> listarSalas() {
        return salaRepository.findAll();
    }

    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    public List<EstadoReserva> listarEstados() {
        return estadoRepository.findAll();
    }

    public List<HorarioActividad> listarHorarios() {
        return horarioRepository.findAll();
    }

    public List<HorarioActividad> listarHorariosPorFecha(LocalDate fecha) {
        if (fecha == null) {
            return listarHorarios();
        }
        String dia = DateUtils.diaSemanaEspanol(fecha);
        return horarioRepository.findBy(h -> DateUtils.mismoDiaSemana(fecha, h.getDiaActividad())
                || DateUtils.normalizarDia(dia).equals(DateUtils.normalizarDia(h.getDiaActividad())));
    }

    public Optional<Reserva> buscarPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return reservaRepository.findById(id.trim());
    }

    public Optional<Sala> buscarSala(Integer id) {
        return salaRepository.findById(id);
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

    public Reserva guardar(Reserva reserva, boolean esNuevo) {
        validar(reserva, esNuevo);
        Optional<Reserva> existente = buscarPorId(reserva.getIdReserva());

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Reserva",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            if (reserva.getIdEstadoReserva() == null || reserva.getIdEstadoReserva().isBlank()) {
                reserva.setIdEstadoReserva(EstadoReservaIds.ACTIVA);
            }
            Reserva creada = reservaRepository.insert(reserva);
            advertirSiFallaAuditoria(auditoriaService.registrar(
                    "CREAR", "Reserva", creada.getIdReserva(),
                    "Reserva creada para sala " + creada.getIdSalaReserva()
                            + " fecha " + DateUtils.format(creada.getFechaReserva())));
            return creada;
        }

        if (existente.isEmpty()) {
            throw new ValidationException("ID Reserva",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        if (!existente.get().getIdReserva().equalsIgnoreCase(reserva.getIdReserva())) {
            throw new ValidationException("ID Reserva", "no se puede modificar el identificador.");
        }
        Reserva actualizada = reservaRepository.update(reserva);
        advertirSiFallaAuditoria(auditoriaService.registrar(
                "MODIFICAR", "Reserva", actualizada.getIdReserva(),
                "Reserva modificada."));
        return actualizada;
    }

    public Reserva cancelar(String idReserva, String motivo) {
        return cambiarEstado(idReserva, EstadoReservaIds.CANCELADA, "CANCELAR", motivo);
    }

    public Reserva reversar(String idReserva, String motivo) {
        asegurarAdministrador("reversar reservas");
        return cambiarEstado(idReserva, EstadoReservaIds.REVERSADA, "REVERSAR", motivo);
    }

    public void eliminar(String idReserva) {
        asegurarAdministrador("eliminar reservas");
        String id = Validators.requireText("ID Reserva", idReserva).trim();
        Reserva actual = buscarPorId(id).orElseThrow(() ->
                new ValidationException("ID Reserva", "no existe. No hay nada que eliminar."));

        if (EstadoReservaIds.bloqueaDisponibilidad(actual.getIdEstadoReserva())) {
            throw new ValidationException("ID Reserva",
                    "no se puede eliminar una reserva activa. Cancélela o revérsala primero.");
        }
        if (!EstadoReservaIds.permiteEliminacionFisica(actual.getIdEstadoReserva())) {
            throw new ValidationException("ID Reserva",
                    "solo se pueden eliminar físicamente reservas canceladas o reversadas.");
        }
        reservaRepository.deleteById(id);
        advertirSiFallaAuditoria(auditoriaService.registrar(
                "ELIMINAR", "Reserva", id, "Eliminación física de reserva."));
    }

    public void validar(Reserva reserva, boolean esNuevo) {
        if (reserva == null) {
            throw new ValidationException("Reserva", "los datos son obligatorios.");
        }
        String id = Validators.requireText("ID Reserva", reserva.getIdReserva());
        reserva.setIdReserva(id.trim());

        if (reserva.getIdSalaReserva() == null || salaRepository.findById(reserva.getIdSalaReserva()).isEmpty()) {
            throw new ValidationException("Sala", "debe existir. Seleccione una sala válida.");
        }
        Cliente cliente = clienteRepository.findById(reserva.getIdClienteReserva())
                .orElseThrow(() -> new ValidationException("Cliente",
                        "debe existir. Seleccione un cliente válido."));
        if (!cliente.isActivo()) {
            throw new ValidationException("Cliente",
                    "está inactivo. Solo clientes activos pueden reservar.");
        }
        if (!cliente.isSocio()) {
            throw new ValidationException("Cliente",
                    "debe ser socio activo. Los invitados no pueden reservar salas.");
        }

        HorarioActividad horario = horarioRepository.findById(reserva.getIdHorarioReserva())
                .orElseThrow(() -> new ValidationException("Horario",
                        "debe existir. Seleccione un horario válido."));

        if (estadoRepository.findById(reserva.getIdEstadoReserva()).isEmpty()) {
            throw new ValidationException("Estado",
                    "debe existir. Seleccione un estado válido.");
        }

        if (reserva.getFechaReserva() == null) {
            throw new ValidationException("Fecha", "es obligatoria. Formato dd/MM/yyyy.");
        }
        if (esNuevo && reserva.getFechaReserva().isBefore(DateUtils.today())) {
            throw new ValidationException("Fecha",
                    "no puede ser anterior a la fecha actual al crear una reserva.");
        }
        if (!DateUtils.mismoDiaSemana(reserva.getFechaReserva(), horario.getDiaActividad())) {
            throw new ValidationException("Fecha",
                    "el día de la fecha (" + DateUtils.diaSemanaEspanol(reserva.getFechaReserva())
                            + ") no coincide con el día del horario (" + horario.getDiaActividad() + ").");
        }

        validarDuplicadoActivo(reserva);
    }

    private void validarDuplicadoActivo(Reserva reserva) {
        List<Reserva> coincidencias = reservaRepository.findBySalaFechaHorario(
                reserva.getIdSalaReserva(), reserva.getFechaReserva(), reserva.getIdHorarioReserva());
        boolean conflicto = coincidencias.stream()
                .filter(r -> EstadoReservaIds.bloqueaDisponibilidad(r.getIdEstadoReserva()))
                .anyMatch(r -> !r.getIdReserva().equalsIgnoreCase(reserva.getIdReserva()));
        if (conflicto) {
            throw new ValidationException("Reserva",
                    "ya existe una reserva activa para la misma sala, fecha y horario.");
        }
    }

    private Reserva cambiarEstado(String idReserva, String nuevoEstado, String accion, String motivo) {
        String id = Validators.requireText("ID Reserva", idReserva).trim();
        Reserva actual = buscarPorId(id).orElseThrow(() ->
                new ValidationException("ID Reserva", "no existe."));

        if (!EstadoReservaIds.bloqueaDisponibilidad(actual.getIdEstadoReserva())) {
            throw new ValidationException("Estado",
                    "la reserva ya está " + actual.getIdEstadoReserva()
                            + " y no se puede " + accion.toLowerCase() + ".");
        }
        if (estadoRepository.findById(nuevoEstado).isEmpty()) {
            throw new ValidationException("Estado", "el estado destino no existe en el catálogo.");
        }

        String anterior = actual.getIdEstadoReserva();
        actual.setIdEstadoReserva(nuevoEstado);
        Reserva actualizada = reservaRepository.update(actual);

        String desc = "Estado " + anterior + " -> " + nuevoEstado
                + (motivo == null || motivo.isBlank() ? "" : ". Motivo: " + motivo.trim());
        advertirSiFallaAuditoria(auditoriaService.registrar(accion, "Reserva", id, desc));
        return actualizada;
    }

    private void asegurarAdministrador(String accion) {
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException("Acceso denegado. Solo el administrador puede " + accion + ".");
        }
    }

    private boolean ultimaAuditoriaFallida;

    private void advertirSiFallaAuditoria(boolean ok) {
        ultimaAuditoriaFallida = !ok;
    }

    public boolean isUltimaAuditoriaFallida() {
        return ultimaAuditoriaFallida;
    }
}
