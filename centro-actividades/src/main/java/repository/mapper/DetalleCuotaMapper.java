package repository.mapper;

import model.DetalleCuota;
import repository.EntityMapper;
import util.MoneyUtils;
import util.TxtMapper;

import java.util.List;

public class DetalleCuotaMapper implements EntityMapper<DetalleCuota> {

    @Override
    public String getId(DetalleCuota entity) {
        return entity.getClaveCompuesta();
    }

    @Override
    public DetalleCuota fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 5);
        DetalleCuota d = new DetalleCuota();
        d.setIdCuota(p.get(0));
        d.setSecuenciaCuota(Integer.parseInt(p.get(1)));
        d.setConceptoCuota(p.get(2));
        d.setValorCuota(MoneyUtils.parse(p.get(3)).orElse(MoneyUtils.zero()));
        d.setIdCobroCuota(p.get(4));
        return d;
    }

    @Override
    public String toLine(DetalleCuota entity) {
        return TxtMapper.join(
                entity.getIdCuota(),
                String.valueOf(entity.getSecuenciaCuota()),
                entity.getConceptoCuota(),
                MoneyUtils.toStorage(entity.getValorCuota()),
                entity.getIdCobroCuota()
        );
    }
}
