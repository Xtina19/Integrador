package repository;

import config.AppConfig;
import model.HorarioActividad;
import repository.mapper.HorarioActividadMapper;

import java.util.List;

public class HorarioActividadRepository extends TxtRepository<HorarioActividad> {

    public HorarioActividadRepository() {
        super(AppConfig.horariosActividadesFile(), new HorarioActividadMapper());
    }

    public List<HorarioActividad> findByActividad(Integer idActividad) {
        if (idActividad == null) {
            return List.of();
        }
        return findBy(h -> idActividad.equals(h.getIdActividad()));
    }

    public boolean existsByActividad(Integer idActividad) {
        return !findByActividad(idActividad).isEmpty();
    }

    public List<HorarioActividad> findByActividadDiaHora(Integer idActividad, String dia, java.time.LocalTime hora) {
        if (idActividad == null || dia == null || hora == null) {
            return List.of();
        }
        return findBy(h -> idActividad.equals(h.getIdActividad())
                && dia.equalsIgnoreCase(h.getDiaActividad())
                && hora.equals(h.getHoraActividad()));
    }
}
