package repository.mapper;

import model.EncabezadoCuota;
import repository.EntityMapper;
import util.DateUtils;
import util.MoneyUtils;
import util.TxtMapper;

import java.util.List;

public class EncabezadoCuotaMapper implements EntityMapper<EncabezadoCuota> {

    @Override
    public String getId(EncabezadoCuota entity) {
        return entity.getIdCuota();
    }

    @Override
    public EncabezadoCuota fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 5);
        EncabezadoCuota e = new EncabezadoCuota();
        e.setIdCuota(p.get(0));
        e.setFechaCuota(DateUtils.parseDate(p.get(1)).orElse(null));
        e.setIdClienteCuota(Integer.parseInt(p.get(2)));
        e.setValorCobro(MoneyUtils.parse(p.get(3)).orElse(MoneyUtils.zero()));
        e.setStatusCuota(TxtMapper.storageToBool(p.get(4)));
        return e;
    }

    @Override
    public String toLine(EncabezadoCuota entity) {
        return TxtMapper.join(
                entity.getIdCuota(),
                DateUtils.format(entity.getFechaCuota()),
                String.valueOf(entity.getIdClienteCuota()),
                MoneyUtils.toStorage(entity.getValorCobro()),
                TxtMapper.boolToStorage(entity.getStatusCuota())
        );
    }
}
