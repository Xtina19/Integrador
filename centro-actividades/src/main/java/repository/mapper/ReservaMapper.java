package repository.mapper;

import model.Reserva;
import repository.EntityMapper;
import util.DateUtils;
import util.TxtMapper;

import java.util.List;

public class ReservaMapper implements EntityMapper<Reserva> {

    @Override
    public String getId(Reserva entity) {
        return entity.getIdReserva();
    }

    @Override
    public Reserva fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 6);
        Reserva r = new Reserva();
        r.setIdReserva(p.get(0));
        r.setIdSalaReserva(Integer.parseInt(p.get(1)));
        r.setIdClienteReserva(Integer.parseInt(p.get(2)));
        r.setFechaReserva(DateUtils.parseDate(p.get(3)).orElse(null));
        r.setIdHorarioReserva(p.get(4));
        r.setIdEstadoReserva(p.get(5));
        return r;
    }

    @Override
    public String toLine(Reserva entity) {
        return TxtMapper.join(
                entity.getIdReserva(),
                String.valueOf(entity.getIdSalaReserva()),
                String.valueOf(entity.getIdClienteReserva()),
                DateUtils.format(entity.getFechaReserva()),
                entity.getIdHorarioReserva(),
                entity.getIdEstadoReserva()
        );
    }
}
