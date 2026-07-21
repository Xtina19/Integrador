package repository.mapper;

import model.Cliente;
import repository.EntityMapper;
import util.DateUtils;
import util.MoneyUtils;
import util.TxtMapper;

import java.util.List;

public class ClienteMapper implements EntityMapper<Cliente> {

    @Override
    public String getId(Cliente entity) {
        return entity.getIdCliente() == null ? null : String.valueOf(entity.getIdCliente());
    }

    @Override
    public Cliente fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 14);
        Cliente c = new Cliente();
        c.setIdCliente(Integer.parseInt(p.get(0)));
        c.setNombreCliente(p.get(1));
        c.setApellidoPaternoCliente(p.get(2));
        c.setApellidoMaternoCliente(p.get(3));
        c.setDireccionCliente(p.get(4));
        c.setFechaNacimientoCliente(DateUtils.parseDate(p.get(5)).orElse(null));
        c.setTelefonoCliente(p.get(6));
        c.setCelularCliente(p.get(7));
        c.setFechaIngreso(DateUtils.parseDate(p.get(8)).orElse(null));
        c.setStatusCliente(TxtMapper.storageToBool(p.get(9)));
        c.setTipoCliente(Integer.parseInt(p.get(10)));
        c.setCorreoCliente(TxtMapper.emptyToNull(p.get(11)));
        c.setBalanceCliente(MoneyUtils.parse(p.get(12)).orElse(MoneyUtils.zero()));
        c.setValorCuotaCliente(MoneyUtils.parse(p.get(13)).orElse(MoneyUtils.zero()));
        return c;
    }

    @Override
    public String toLine(Cliente entity) {
        return TxtMapper.join(
                String.valueOf(entity.getIdCliente()),
                entity.getNombreCliente(),
                entity.getApellidoPaternoCliente(),
                entity.getApellidoMaternoCliente(),
                entity.getDireccionCliente(),
                DateUtils.format(entity.getFechaNacimientoCliente()),
                entity.getTelefonoCliente(),
                entity.getCelularCliente(),
                DateUtils.format(entity.getFechaIngreso()),
                TxtMapper.boolToStorage(entity.getStatusCliente()),
                String.valueOf(entity.getTipoCliente()),
                TxtMapper.nullToEmpty(entity.getCorreoCliente()),
                MoneyUtils.toStorage(entity.getBalanceCliente()),
                MoneyUtils.toStorage(entity.getValorCuotaCliente())
        );
    }
}
