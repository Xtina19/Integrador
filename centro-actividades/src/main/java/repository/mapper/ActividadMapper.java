package repository.mapper;

import model.Actividad;
import repository.EntityMapper;
import util.TxtMapper;

import java.util.List;

public class ActividadMapper implements EntityMapper<Actividad> {

    @Override
    public String getId(Actividad entity) {
        return entity.getIdActividad() == null ? null : String.valueOf(entity.getIdActividad());
    }

    @Override
    public Actividad fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 5);
        Actividad a = new Actividad();
        a.setIdActividad(Integer.parseInt(p.get(0)));
        a.setNombreActividad(p.get(1));
        a.setDescripcionActividad(p.get(2));
        a.setIdLocalizacionActividad(Integer.parseInt(p.get(3)));
        a.setIdEntrenadorActividad(Integer.parseInt(p.get(4)));
        return a;
    }

    @Override
    public String toLine(Actividad entity) {
        return TxtMapper.join(
                String.valueOf(entity.getIdActividad()),
                entity.getNombreActividad(),
                entity.getDescripcionActividad(),
                String.valueOf(entity.getIdLocalizacionActividad()),
                String.valueOf(entity.getIdEntrenadorActividad())
        );
    }
}
