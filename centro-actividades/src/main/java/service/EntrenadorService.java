package service;

import model.Entrenador;
import repository.EntrenadorRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.List;
import java.util.Optional;

public class EntrenadorService {

    private final EntrenadorRepository repository;

    public EntrenadorService() {
        this(new EntrenadorRepository());
    }

    public EntrenadorService(EntrenadorRepository repository) {
        this.repository = repository;
    }

    public List<Entrenador> listar() {
        return repository.findAll();
    }

    public Optional<Entrenador> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Optional<Entrenador> buscarPorId(String idTexto) {
        if (idTexto == null || idTexto.isBlank()) {
            return Optional.empty();
        }
        Integer id = Validators.requireInteger("ID Entrenador", idTexto);
        return buscarPorId(id);
    }

    public Entrenador guardar(Entrenador entrenador, boolean esNuevo) {
        validar(entrenador);
        Integer id = entrenador.getIdEntrenador();
        Optional<Entrenador> existente = buscarPorId(id);

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Entrenador",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            return repository.insert(entrenador);
        }

        if (existente.isEmpty()) {
            throw new ValidationException("ID Entrenador",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        return repository.update(entrenador);
    }

    public void eliminar(Integer id) {
        if (id == null) {
            throw new ValidationException("ID Entrenador", "es obligatorio para eliminar.");
        }
        if (buscarPorId(id).isEmpty()) {
            throw new ValidationException("ID Entrenador", "no existe. No hay nada que eliminar.");
        }
        repository.deleteById(String.valueOf(id));
    }

    public void validar(Entrenador entrenador) {
        if (entrenador == null) {
            throw new ValidationException("Entrenador", "los datos son obligatorios.");
        }
        if (entrenador.getIdEntrenador() == null) {
            throw new ValidationException("ID Entrenador", "es obligatorio y debe ser un entero.");
        }
        if (entrenador.getIdEntrenador() <= 0) {
            throw new ValidationException("ID Entrenador", "debe ser un entero mayor que cero.");
        }
        entrenador.setNombreEntrenador(Validators.requireText("Nombre", entrenador.getNombreEntrenador()));
        entrenador.setApellidoEntrenador(Validators.requireText("Apellido", entrenador.getApellidoEntrenador()));
        Validators.optionalPhone("Teléfono", entrenador.getTelefonoEntrenador());
        Validators.optionalEmail("Correo", entrenador.getCorreoEntrenador());
        if (entrenador.getTelefonoEntrenador() != null && entrenador.getTelefonoEntrenador().isBlank()) {
            entrenador.setTelefonoEntrenador(null);
        }
        if (entrenador.getCorreoEntrenador() != null && entrenador.getCorreoEntrenador().isBlank()) {
            entrenador.setCorreoEntrenador(null);
        }
    }
}
