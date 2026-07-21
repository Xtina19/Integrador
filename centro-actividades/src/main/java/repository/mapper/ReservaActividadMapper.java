package repository.mapper;

import model.ReservaActividad;
import repository.EntityMapper;
import util.DateUtils;
import util.TxtMapper;

import java.util.List;

public class ReservaActividadMapper implements EntityMapper<ReservaActividad> {

    @Override
    public String getId(ReservaActividad entity) {
        return entity.getIdReservaActividad() == null ? null : String.valueOf(entity.getIdReservaActividad());
    }

    @Override
    public ReservaActividad fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 7);
        ReservaActividad r = new ReservaActividad();
        r.setIdReservaActividad(Integer.parseInt(p.get(0)));
        r.setFechaReserva(DateUtils.parseDate(p.get(1)).orElse(null));
        r.setFechaBaja(DateUtils.parseDate(p.get(2)).orElse(null));
        r.setIdEstadoReservaActividad(p.get(3));
        r.setIdClienteReservaActividad(Integer.parseInt(p.get(4)));
        r.setIdActividad(Integer.parseInt(p.get(5)));
        r.setIdHorarioActividad(p.get(6));
        return r;
    }

    @Override
    public String toLine(ReservaActividad entity) {
        return TxtMapper.join(
                String.valueOf(entity.getIdReservaActividad()),
                DateUtils.format(entity.getFechaReserva()),
                DateUtils.format(entity.getFechaBaja()),
                entity.getIdEstadoReservaActividad(),
                String.valueOf(entity.getIdClienteReservaActividad()),
                String.valueOf(entity.getIdActividad()),
                entity.getIdHorarioActividad()
        );
    }
}
