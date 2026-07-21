package repository;

import config.AppConfig;
import model.Cobro;
import repository.mapper.CobroMapper;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public class CobroRepository extends TxtRepository<Cobro> {

    public CobroRepository() {
        super(AppConfig.cobrosFile(), new CobroMapper());
    }

    public List<Cobro> findPendientesByCliente(Integer idCliente) {
        return findBy(c -> idCliente.equals(c.getIdClienteCobro()) && c.isPendiente())
                .stream()
                .sorted(Comparator.comparing(Cobro::getFechaCobro, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Cobro::getIdCobro))
                .toList();
    }

    public List<Cobro> findByCliente(Integer idCliente) {
        return findBy(c -> idCliente.equals(c.getIdClienteCobro()));
    }

    public List<Cobro> findByRangoFechas(LocalDate desde, LocalDate hasta) {
        return findBy(c -> c.getFechaCobro() != null
                && !c.getFechaCobro().isBefore(desde)
                && !c.getFechaCobro().isAfter(hasta));
    }

    public List<Cobro> findByConceptoContains(String fragmento) {
        if (fragmento == null || fragmento.isBlank()) {
            return List.of();
        }
        String needle = fragmento.toLowerCase();
        return findBy(c -> c.getConceptoCobro() != null
                && c.getConceptoCobro().toLowerCase().contains(needle));
    }

    public boolean existsByCliente(Integer idCliente) {
        return !findByCliente(idCliente).isEmpty();
    }
}
