package repository;

import config.AppConfig;
import model.Sala;
import repository.mapper.SalaMapper;

import java.util.Optional;

public class SalaRepository extends TxtRepository<Sala> {

    public SalaRepository() {
        super(AppConfig.salasFile(), new SalaMapper());
    }

    public Optional<Sala> findById(Integer id) {
        return id == null ? Optional.empty() : findById(String.valueOf(id));
    }
}
