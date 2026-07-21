package repository.mapper;

import model.HorarioActividad;
import repository.EntityMapper;
import util.TxtMapper;

import java.time.LocalTime;
import java.util.List;

public class HorarioActividadMapper implements EntityMapper<HorarioActividad> {

    @Override
    public String getId(HorarioActividad entity) {
        return entity.getIdHorarioActividad();
    }

    @Override
    public HorarioActividad fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 4);
        HorarioActividad h = new HorarioActividad();
        h.setIdHorarioActividad(p.get(0));
        h.setDiaActividad(p.get(1));
        h.setHoraActividad(LocalTime.parse(p.get(2).trim(), HorarioActividad.HORA_FORMATTER));
        h.setIdActividad(Integer.parseInt(p.get(3)));
        return h;
    }

    @Override
    public String toLine(HorarioActividad entity) {
        return TxtMapper.join(
                entity.getIdHorarioActividad(),
                entity.getDiaActividad(),
                entity.getHoraFormateada(),
                String.valueOf(entity.getIdActividad())
        );
    }
}
