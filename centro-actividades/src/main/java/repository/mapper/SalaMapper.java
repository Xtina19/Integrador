package repository.mapper;

import model.Sala;
import repository.EntityMapper;
import util.TxtMapper;

import java.util.List;

public class SalaMapper implements EntityMapper<Sala> {

    @Override
    public String getId(Sala entity) {
        return entity.getIdSala() == null ? null : String.valueOf(entity.getIdSala());
    }

    @Override
    public Sala fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 4);
        Sala s = new Sala();
        s.setIdSala(Integer.parseInt(p.get(0)));
        s.setNombreSala(p.get(1));
        s.setDescripcionSala(p.get(2));
        s.setIdLocalizacionSala(Integer.parseInt(p.get(3)));
        return s;
    }

    @Override
    public String toLine(Sala entity) {
        return TxtMapper.join(
                String.valueOf(entity.getIdSala()),
                entity.getNombreSala(),
                entity.getDescripcionSala(),
                String.valueOf(entity.getIdLocalizacionSala())
        );
    }
}
