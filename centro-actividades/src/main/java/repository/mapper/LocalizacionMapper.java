package repository.mapper;

import model.Localizacion;
import repository.EntityMapper;
import util.TxtMapper;

import java.util.List;

public class LocalizacionMapper implements EntityMapper<Localizacion> {

    @Override
    public String getId(Localizacion entity) {
        return entity.getIdLocalizacion() == null ? null : String.valueOf(entity.getIdLocalizacion());
    }

    @Override
    public Localizacion fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 2);
        return new Localizacion(Integer.parseInt(p.get(0)), p.get(1));
    }

    @Override
    public String toLine(Localizacion entity) {
        return TxtMapper.join(
                String.valueOf(entity.getIdLocalizacion()),
                entity.getTipo()
        );
    }
}
