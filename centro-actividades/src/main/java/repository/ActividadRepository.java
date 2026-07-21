package repository;

import config.AppConfig;
import model.Actividad;
import repository.mapper.ActividadMapper;

import java.util.Optional;

public class ActividadRepository extends TxtRepository<Actividad> {

    public ActividadRepository() {
        super(AppConfig.actividadesFile(), new ActividadMapper());
    }

    public Optional<Actividad> findById(Integer id) {
        return id == null ? Optional.empty() : findById(String.valueOf(id));
    }
}
