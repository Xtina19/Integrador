package service;

import model.Actividad;
import model.HorarioActividad;
import repository.ActividadRepository;
import repository.HorarioActividadRepository;
import repository.ReservaActividadRepository;
import repository.ReservaRepository;
import validation.ValidationException;
import validation.Validators;

import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public class HorarioActividadService {

    private final HorarioActividadRepository horarioRepository;
    private final ActividadRepository actividadRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaActividadRepository reservaActividadRepository;

    public HorarioActividadService() {
        this(new HorarioActividadRepository(), new ActividadRepository(),
                new ReservaRepository(), new ReservaActividadRepository());
    }

    public HorarioActividadService(HorarioActividadRepository horarioRepository,
                                   ActividadRepository actividadRepository,
                                   ReservaRepository reservaRepository,
                                   ReservaActividadRepository reservaActividadRepository) {
        this.horarioRepository = horarioRepository;
        this.actividadRepository = actividadRepository;
        this.reservaRepository = reservaRepository;
        this.reservaActividadRepository = reservaActividadRepository;
    }

    public List<HorarioActividad> listar() {
        return horarioRepository.findAll();
    }

    public List<Actividad> listarActividades() {
        return actividadRepository.findAll();
    }

    public Optional<HorarioActividad> buscarPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return horarioRepository.findById(id.trim());
    }

    public Optional<Actividad> buscarActividad(Integer id) {
        return actividadRepository.findById(id);
    }

    public HorarioActividad guardar(HorarioActividad horario, boolean esNuevo) {
        validar(horario);
        String id = horario.getIdHorarioActividad().trim();
        Optional<HorarioActividad> existente = buscarPorId(id);

        validarDuplicado(horario, esNuevo ? null : id);

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Horario",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            return horarioRepository.insert(horario);
        }
        if (existente.isEmpty()) {
            throw new ValidationException("ID Horario",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        return horarioRepository.update(horario);
    }

    public void eliminar(String id) {
        String safeId = Validators.requireText("ID Horario", id).trim();
        if (buscarPorId(safeId).isEmpty()) {
            throw new ValidationException("ID Horario", "no existe. No hay nada que eliminar.");
        }
        if (reservaRepository.existsByHorario(safeId) || reservaActividadRepository.existsByHorario(safeId)) {
            throw new ValidationException("ID Horario",
                    "no se puede eliminar porque está asociado a una reserva.");
        }
        horarioRepository.deleteById(safeId);
    }

    public void validar(HorarioActividad horario) {
        if (horario == null) {
            throw new ValidationException("Horario", "los datos son obligatorios.");
        }
        String id = Validators.requireText("ID Horario", horario.getIdHorarioActividad());
        horario.setIdHorarioActividad(id.trim());

        String dia = Validators.requireText("Día", horario.getDiaActividad());
        Validators.requireDia("Día", dia);
        horario.setDiaActividad(normalizarDia(dia));

        if (horario.getHoraActividad() == null) {
            throw new ValidationException("Hora", "es obligatoria. Use formato HH:mm. Ejemplo: 08:00");
        }

        if (horario.getIdActividad() == null) {
            throw new ValidationException("Actividad", "es obligatoria. Seleccione una opción del listado.");
        }
        if (actividadRepository.findById(horario.getIdActividad()).isEmpty()) {
            throw new ValidationException("Actividad",
                    "no existe. Seleccione una actividad válida.");
        }
    }

    public LocalTime parseHora(String valor) {
        return Validators.requireHora("Hora", valor);
    }

    private void validarDuplicado(HorarioActividad horario, String idActual) {
        List<HorarioActividad> coincidencias = horarioRepository.findByActividadDiaHora(
                horario.getIdActividad(), horario.getDiaActividad(), horario.getHoraActividad());
        boolean duplicado = coincidencias.stream()
                .anyMatch(h -> idActual == null || !h.getIdHorarioActividad().equalsIgnoreCase(idActual));
        if (duplicado) {
            throw new ValidationException("Horario",
                    "ya existe otro horario para la misma actividad, día y hora. Elija otra combinación.");
        }
    }

    private String normalizarDia(String dia) {
        String lower = dia.trim().toLowerCase(Locale.ROOT)
                .replace("á", "a").replace("é", "e").replace("í", "i")
                .replace("ó", "o").replace("ú", "u");
        return switch (lower) {
            case "lunes" -> "Lunes";
            case "martes" -> "Martes";
            case "miercoles" -> "Miércoles";
            case "jueves" -> "Jueves";
            case "viernes" -> "Viernes";
            case "sabado" -> "Sábado";
            case "domingo" -> "Domingo";
            default -> dia.trim();
        };
    }
}
