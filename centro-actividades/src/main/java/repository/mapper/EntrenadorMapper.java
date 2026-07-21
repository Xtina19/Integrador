package repository.mapper;

import model.Entrenador;
import repository.EntityMapper;
import util.TxtMapper;

import java.util.List;

public class EntrenadorMapper implements EntityMapper<Entrenador> {

    @Override
    public String getId(Entrenador entity) {
        return entity.getIdEntrenador() == null ? null : String.valueOf(entity.getIdEntrenador());
    }

    @Override
    public Entrenador fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 5);
        Entrenador e = new Entrenador();
        e.setIdEntrenador(Integer.parseInt(p.get(0)));
        e.setNombreEntrenador(p.get(1));
        e.setApellidoEntrenador(p.get(2));
        e.setTelefonoEntrenador(TxtMapper.emptyToNull(p.get(3)));
        e.setCorreoEntrenador(TxtMapper.emptyToNull(p.get(4)));
        return e;
    }

    @Override
    public String toLine(Entrenador entity) {
        return TxtMapper.join(
                String.valueOf(entity.getIdEntrenador()),
                entity.getNombreEntrenador(),
                entity.getApellidoEntrenador(),
                TxtMapper.nullToEmpty(entity.getTelefonoEntrenador()),
                TxtMapper.nullToEmpty(entity.getCorreoEntrenador())
        );
    }
}
