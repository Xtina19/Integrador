package repository;

import config.AppConfig;
import model.Entrenador;
import repository.mapper.EntrenadorMapper;

import java.util.Optional;

public class EntrenadorRepository extends TxtRepository<Entrenador> {

    public EntrenadorRepository() {
        super(AppConfig.entrenadoresFile(), new EntrenadorMapper());
    }

    public Optional<Entrenador> findById(Integer id) {
        return id == null ? Optional.empty() : findById(String.valueOf(id));
    }
}
