package repository.mapper;

import model.Auditoria;
import repository.EntityMapper;
import util.DateUtils;
import util.TxtMapper;

import java.util.List;

public class AuditoriaMapper implements EntityMapper<Auditoria> {

    @Override
    public String getId(Auditoria entity) {
        return DateUtils.format(entity.getFechaHora()) + "#" + entity.getAccion() + "#" + entity.getIdentificador();
    }

    @Override
    public Auditoria fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 6);
        Auditoria a = new Auditoria();
        a.setFechaHora(DateUtils.parseDateTime(p.get(0)).orElse(null));
        a.setUsuario(p.get(1));
        a.setAccion(p.get(2));
        a.setEntidad(p.get(3));
        a.setIdentificador(p.get(4));
        a.setDescripcion(p.get(5));
        return a;
    }

    @Override
    public String toLine(Auditoria entity) {
        return TxtMapper.join(
                DateUtils.format(entity.getFechaHora()),
                TxtMapper.nullToEmpty(entity.getUsuario()),
                TxtMapper.nullToEmpty(entity.getAccion()),
                TxtMapper.nullToEmpty(entity.getEntidad()),
                TxtMapper.nullToEmpty(entity.getIdentificador()),
                TxtMapper.nullToEmpty(entity.getDescripcion())
        );
    }
}
