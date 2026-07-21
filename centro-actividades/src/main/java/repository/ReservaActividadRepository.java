package repository;

import config.AppConfig;
import model.ReservaActividad;
import repository.mapper.ReservaActividadMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public class ReservaActividadRepository extends TxtRepository<ReservaActividad> {

    public ReservaActividadRepository() {
        super(AppConfig.reservasActividadesFile(), new ReservaActividadMapper());
    }

    public Optional<ReservaActividad> findById(Integer id) {
        return id == null ? Optional.empty() : findById(String.valueOf(id));
    }

    public List<ReservaActividad> findActivasDuplicadas(Integer idCliente, Integer idActividad,
                                                        LocalDate fecha, String idHorario) {
        return findBy(r -> idCliente.equals(r.getIdClienteReservaActividad())
                && idActividad.equals(r.getIdActividad())
                && fecha.equals(r.getFechaReserva())
                && idHorario.equalsIgnoreCase(r.getIdHorarioActividad()));
    }

    public List<ReservaActividad> findByActividad(Integer idActividad) {
        if (idActividad == null) {
            return List.of();
        }
        return findBy(r -> idActividad.equals(r.getIdActividad()));
    }

    public List<ReservaActividad> findByHorario(String idHorario) {
        if (idHorario == null || idHorario.isBlank()) {
            return List.of();
        }
        return findBy(r -> idHorario.equalsIgnoreCase(r.getIdHorarioActividad()));
    }

    public List<ReservaActividad> findByCliente(Integer idCliente) {
        if (idCliente == null) {
            return List.of();
        }
        return findBy(r -> idCliente.equals(r.getIdClienteReservaActividad()));
    }

    public boolean existsByActividad(Integer idActividad) {
        return !findByActividad(idActividad).isEmpty();
    }

    public boolean existsByHorario(String idHorario) {
        return !findByHorario(idHorario).isEmpty();
    }

    public boolean existsByCliente(Integer idCliente) {
        return !findByCliente(idCliente).isEmpty();
    }
}
