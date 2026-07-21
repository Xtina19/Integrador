package repository.mapper;

import model.Cobro;
import repository.EntityMapper;
import util.DateUtils;
import util.MoneyUtils;
import util.TxtMapper;

import java.util.List;

public class CobroMapper implements EntityMapper<Cobro> {

    @Override
    public String getId(Cobro entity) {
        return entity.getIdCobro();
    }

    @Override
    public Cobro fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 6);
        Cobro c = new Cobro();
        c.setIdCobro(p.get(0));
        c.setFechaCobro(DateUtils.parseDate(p.get(1)).orElse(null));
        c.setIdClienteCobro(Integer.parseInt(p.get(2)));
        c.setValorCobro(MoneyUtils.parse(p.get(3)).orElse(MoneyUtils.zero()));
        c.setConceptoCobro(p.get(4));
        c.setStatusCobro(TxtMapper.storageToBool(p.get(5)));
        return c;
    }

    @Override
    public String toLine(Cobro entity) {
        return TxtMapper.join(
                entity.getIdCobro(),
                DateUtils.format(entity.getFechaCobro()),
                String.valueOf(entity.getIdClienteCobro()),
                MoneyUtils.toStorage(entity.getValorCobro()),
                entity.getConceptoCobro(),
                TxtMapper.boolToStorage(entity.getStatusCobro())
        );
    }
}
