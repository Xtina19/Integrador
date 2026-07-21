package service;

import model.Localizacion;
import repository.LocalizacionRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.List;
import java.util.Optional;

public class LocalizacionService {

    private final LocalizacionRepository repository;

    public LocalizacionService() {
        this(new LocalizacionRepository());
    }

    public LocalizacionService(LocalizacionRepository repository) {
        this.repository = repository;
    }

    public List<Localizacion> listar() {
        return repository.findAll();
    }

    public Optional<Localizacion> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Optional<Localizacion> buscarPorId(String idTexto) {
        if (idTexto == null || idTexto.isBlank()) {
            return Optional.empty();
        }
        Integer id = Validators.requireInteger("ID Localización", idTexto);
        return buscarPorId(id);
    }

    public Localizacion guardar(Localizacion localizacion, boolean esNuevo) {
        validar(localizacion);
        Integer id = localizacion.getIdLocalizacion();
        Optional<Localizacion> existente = buscarPorId(id);

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Localización",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            return repository.insert(localizacion);
        }

        if (existente.isEmpty()) {
            throw new ValidationException("ID Localización",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        return repository.update(localizacion);
    }

    public void eliminar(Integer id) {
        if (id == null) {
            throw new ValidationException("ID Localización", "es obligatorio para eliminar.");
        }
        if (buscarPorId(id).isEmpty()) {
            throw new ValidationException("ID Localización", "no existe. No hay nada que eliminar.");
        }
        repository.deleteById(String.valueOf(id));
    }

    public void validar(Localizacion localizacion) {
        if (localizacion == null) {
            throw new ValidationException("Localización", "los datos son obligatorios.");
        }
        if (localizacion.getIdLocalizacion() == null) {
            throw new ValidationException("ID Localización", "es obligatorio y debe ser un entero.");
        }
        if (localizacion.getIdLocalizacion() <= 0) {
            throw new ValidationException("ID Localización", "debe ser un entero mayor que cero.");
        }
        localizacion.setTipo(Validators.requireText("Tipo", localizacion.getTipo()));
    }
}
