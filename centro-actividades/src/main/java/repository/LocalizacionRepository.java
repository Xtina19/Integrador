package repository;

import config.AppConfig;
import model.Localizacion;
import repository.mapper.LocalizacionMapper;

import java.util.Optional;

public class LocalizacionRepository extends TxtRepository<Localizacion> {

    public LocalizacionRepository() {
        super(AppConfig.localizacionesFile(), new LocalizacionMapper());
    }

    public Optional<Localizacion> findById(Integer id) {
        return id == null ? Optional.empty() : findById(String.valueOf(id));
    }
}
