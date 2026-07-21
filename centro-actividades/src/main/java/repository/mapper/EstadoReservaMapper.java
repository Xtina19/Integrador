package repository.mapper;

import model.EstadoReserva;
import repository.EntityMapper;
import util.TxtMapper;

import java.util.List;

public class EstadoReservaMapper implements EntityMapper<EstadoReserva> {

    @Override
    public String getId(EstadoReserva entity) {
        return entity.getIdEstadoReserva();
    }

    @Override
    public EstadoReserva fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 3);
        EstadoReserva e = new EstadoReserva();
        e.setIdEstadoReserva(p.get(0));
        e.setEstado(TxtMapper.storageToBool(p.get(1)));
        e.setDescripcion(p.get(2));
        return e;
    }

    @Override
    public String toLine(EstadoReserva entity) {
        return TxtMapper.join(
                entity.getIdEstadoReserva(),
                TxtMapper.boolToStorage(entity.getEstado()),
                TxtMapper.nullToEmpty(entity.getDescripcion())
        );
    }
}
