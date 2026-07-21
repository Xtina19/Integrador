package service;

import model.Localizacion;
import model.Sala;
import repository.LocalizacionRepository;
import repository.ReservaRepository;
import repository.SalaRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.List;
import java.util.Optional;

public class SalaService {

    private final SalaRepository salaRepository;
    private final LocalizacionRepository localizacionRepository;
    private final ReservaRepository reservaRepository;

    public SalaService() {
        this(new SalaRepository(), new LocalizacionRepository(), new ReservaRepository());
    }

    public SalaService(SalaRepository salaRepository,
                       LocalizacionRepository localizacionRepository,
                       ReservaRepository reservaRepository) {
        this.salaRepository = salaRepository;
        this.localizacionRepository = localizacionRepository;
        this.reservaRepository = reservaRepository;
    }

    public List<Sala> listar() {
        return salaRepository.findAll();
    }

    public List<Localizacion> listarLocalizaciones() {
        return localizacionRepository.findAll();
    }

    public Optional<Sala> buscarPorId(Integer id) {
        return salaRepository.findById(id);
    }

    public Optional<Sala> buscarPorId(String idTexto) {
        if (idTexto == null || idTexto.isBlank()) {
            return Optional.empty();
        }
        return buscarPorId(Validators.requireInteger("ID Sala", idTexto));
    }

    public Optional<Localizacion> buscarLocalizacion(Integer id) {
        return localizacionRepository.findById(id);
    }

    public Sala guardar(Sala sala, boolean esNuevo) {
        validar(sala);
        Optional<Sala> existente = buscarPorId(sala.getIdSala());
        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Sala",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            return salaRepository.insert(sala);
        }
        if (existente.isEmpty()) {
            throw new ValidationException("ID Sala",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        return salaRepository.update(sala);
    }

    public void eliminar(Integer id) {
        if (id == null) {
            throw new ValidationException("ID Sala", "es obligatorio para eliminar.");
        }
        if (buscarPorId(id).isEmpty()) {
            throw new ValidationException("ID Sala", "no existe. No hay nada que eliminar.");
        }
        if (reservaRepository.existsBySala(id)) {
            throw new ValidationException("ID Sala",
                    "no se puede eliminar porque tiene reservas asociadas.");
        }
        salaRepository.deleteById(String.valueOf(id));
    }

    public void validar(Sala sala) {
        if (sala == null) {
            throw new ValidationException("Sala", "los datos son obligatorios.");
        }
        if (sala.getIdSala() == null || sala.getIdSala() <= 0) {
            throw new ValidationException("ID Sala", "debe ser un entero mayor que cero.");
        }
        sala.setNombreSala(Validators.requireText("Nombre", sala.getNombreSala()));
        sala.setDescripcionSala(Validators.requireText("Descripción", sala.getDescripcionSala()));
        if (sala.getIdLocalizacionSala() == null) {
            throw new ValidationException("Localización", "es obligatoria. Seleccione una opción del listado.");
        }
        if (localizacionRepository.findById(sala.getIdLocalizacionSala()).isEmpty()) {
            throw new ValidationException("Localización",
                    "no existe. Seleccione una localización válida del listado.");
        }
    }
}
