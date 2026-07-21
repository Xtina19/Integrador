package repository;

import config.AppConfig;
import model.Cliente;
import repository.mapper.ClienteMapper;

import java.util.List;
import java.util.Optional;

public class ClienteRepository extends TxtRepository<Cliente> {

    public ClienteRepository() {
        super(AppConfig.clientesFile(), new ClienteMapper());
    }

    public Optional<Cliente> findById(Integer id) {
        return id == null ? Optional.empty() : findById(String.valueOf(id));
    }

    public List<Cliente> findSociosActivos() {
        return findBy(c -> c.isSocio() && c.isActivo());
    }

    public List<Cliente> findConBalancePendiente() {
        return findBy(c -> c.getBalanceCliente() != null
                && c.getBalanceCliente().compareTo(java.math.BigDecimal.ZERO) > 0);
    }
}
