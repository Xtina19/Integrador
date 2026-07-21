package service;

import model.Actividad;
import model.Entrenador;
import model.Localizacion;
import repository.ActividadRepository;
import repository.EntrenadorRepository;
import repository.HorarioActividadRepository;
import repository.LocalizacionRepository;
import repository.ReservaActividadRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.List;
import java.util.Optional;

public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final LocalizacionRepository localizacionRepository;
    private final EntrenadorRepository entrenadorRepository;
    private final HorarioActividadRepository horarioRepository;
    private final ReservaActividadRepository reservaActividadRepository;

    public ActividadService() {
        this(new ActividadRepository(), new LocalizacionRepository(), new EntrenadorRepository(),
                new HorarioActividadRepository(), new ReservaActividadRepository());
    }

    public ActividadService(ActividadRepository actividadRepository,
                            LocalizacionRepository localizacionRepository,
                            EntrenadorRepository entrenadorRepository,
                            HorarioActividadRepository horarioRepository,
                            ReservaActividadRepository reservaActividadRepository) {
        this.actividadRepository = actividadRepository;
        this.localizacionRepository = localizacionRepository;
        this.entrenadorRepository = entrenadorRepository;
        this.horarioRepository = horarioRepository;
        this.reservaActividadRepository = reservaActividadRepository;
    }

    public List<Actividad> listar() {
        return actividadRepository.findAll();
    }

    public List<Localizacion> listarLocalizaciones() {
        return localizacionRepository.findAll();
    }

    public List<Entrenador> listarEntrenadores() {
        return entrenadorRepository.findAll();
    }

    public Optional<Actividad> buscarPorId(Integer id) {
        return actividadRepository.findById(id);
    }

    public Optional<Actividad> buscarPorId(String idTexto) {
        if (idTexto == null || idTexto.isBlank()) {
            return Optional.empty();
        }
        return buscarPorId(Validators.requireInteger("ID Actividad", idTexto));
    }

    public Actividad guardar(Actividad actividad, boolean esNuevo) {
        validar(actividad);
        Optional<Actividad> existente = buscarPorId(actividad.getIdActividad());
        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Actividad",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            return actividadRepository.insert(actividad);
        }
        if (existente.isEmpty()) {
            throw new ValidationException("ID Actividad",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        return actividadRepository.update(actividad);
    }

    public void eliminar(Integer id) {
        if (id == null) {
            throw new ValidationException("ID Actividad", "es obligatorio para eliminar.");
        }
        if (buscarPorId(id).isEmpty()) {
            throw new ValidationException("ID Actividad", "no existe. No hay nada que eliminar.");
        }
        if (horarioRepository.existsByActividad(id)) {
            throw new ValidationException("ID Actividad",
                    "no se puede eliminar porque tiene horarios asociados.");
        }
        if (reservaActividadRepository.existsByActividad(id)) {
            throw new ValidationException("ID Actividad",
                    "no se puede eliminar porque tiene reservas de actividad asociadas.");
        }
        actividadRepository.deleteById(String.valueOf(id));
    }

    public void validar(Actividad actividad) {
        if (actividad == null) {
            throw new ValidationException("Actividad", "los datos son obligatorios.");
        }
        if (actividad.getIdActividad() == null || actividad.getIdActividad() <= 0) {
            throw new ValidationException("ID Actividad", "debe ser un entero mayor que cero.");
        }
        actividad.setNombreActividad(Validators.requireText("Nombre", actividad.getNombreActividad()));
        actividad.setDescripcionActividad(Validators.requireText("Descripción", actividad.getDescripcionActividad()));
        if (actividad.getIdLocalizacionActividad() == null) {
            throw new ValidationException("Localización", "es obligatoria. Seleccione una opción del listado.");
        }
        if (localizacionRepository.findById(actividad.getIdLocalizacionActividad()).isEmpty()) {
            throw new ValidationException("Localización",
                    "no existe. Seleccione una localización válida.");
        }
        if (actividad.getIdEntrenadorActividad() == null) {
            throw new ValidationException("Entrenador", "es obligatorio. Seleccione una opción del listado.");
        }
        if (entrenadorRepository.findById(actividad.getIdEntrenadorActividad()).isEmpty()) {
            throw new ValidationException("Entrenador",
                    "no existe. Seleccione un entrenador válido.");
        }
    }
}
