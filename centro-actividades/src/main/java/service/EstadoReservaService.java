package service;

import model.EstadoReserva;
import repository.EstadoReservaRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.List;
import java.util.Optional;

public class EstadoReservaService {

    private final EstadoReservaRepository repository;

    public EstadoReservaService() {
        this(new EstadoReservaRepository());
    }

    public EstadoReservaService(EstadoReservaRepository repository) {
        this.repository = repository;
    }

    public List<EstadoReserva> listar() {
        return repository.findAll();
    }

    public Optional<EstadoReserva> buscarPorId(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return repository.findById(id.trim());
    }

    public EstadoReserva guardar(EstadoReserva estado, boolean esNuevo) {
        validar(estado);
        String id = estado.getIdEstadoReserva().trim();
        Optional<EstadoReserva> existente = buscarPorId(id);

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Estado",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            return repository.insert(estado);
        }

        if (existente.isEmpty()) {
            throw new ValidationException("ID Estado",
                    "no existe para modificar. Use Nuevo o verifique el ID.");
        }
        return repository.update(estado);
    }

    public void eliminar(String id) {
        String safeId = Validators.requireText("ID Estado", id).trim();
        if (buscarPorId(safeId).isEmpty()) {
            throw new ValidationException("ID Estado", "no existe. No hay nada que eliminar.");
        }
        repository.deleteById(safeId);
    }

    public void validar(EstadoReserva estado) {
        if (estado == null) {
            throw new ValidationException("Estado de reserva", "los datos son obligatorios.");
        }
        String id = Validators.requireText("ID Estado", estado.getIdEstadoReserva());
        estado.setIdEstadoReserva(id.trim().toUpperCase());
        if (estado.getEstado() == null) {
            throw new ValidationException("Estado",
                    "es obligatorio. Seleccione Activo (true) o Inactivo (false).");
        }
        String descripcion = estado.getDescripcion();
        if (descripcion == null || descripcion.isBlank()) {
            estado.setDescripcion(Boolean.TRUE.equals(estado.getEstado()) ? "Activa" : "Inactiva");
        } else {
            estado.setDescripcion(descripcion.trim());
        }
    }
}
