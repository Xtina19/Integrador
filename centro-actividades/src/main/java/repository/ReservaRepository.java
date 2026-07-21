package repository;

import config.AppConfig;
import model.Reserva;
import repository.mapper.ReservaMapper;

import java.time.LocalDate;
import java.util.List;

public class ReservaRepository extends TxtRepository<Reserva> {

    public ReservaRepository() {
        super(AppConfig.reservasFile(), new ReservaMapper());
    }

    public List<Reserva> findBySalaFechaHorario(Integer idSala, LocalDate fecha, String idHorario) {
        return findBy(r -> idSala.equals(r.getIdSalaReserva())
                && fecha.equals(r.getFechaReserva())
                && idHorario.equalsIgnoreCase(r.getIdHorarioReserva()));
    }

    public List<Reserva> findBySala(Integer idSala) {
        if (idSala == null) {
            return List.of();
        }
        return findBy(r -> idSala.equals(r.getIdSalaReserva()));
    }

    public List<Reserva> findByHorario(String idHorario) {
        if (idHorario == null || idHorario.isBlank()) {
            return List.of();
        }
        return findBy(r -> idHorario.equalsIgnoreCase(r.getIdHorarioReserva()));
    }

    public List<Reserva> findByCliente(Integer idCliente) {
        if (idCliente == null) {
            return List.of();
        }
        return findBy(r -> idCliente.equals(r.getIdClienteReserva()));
    }

    public boolean existsBySala(Integer idSala) {
        return !findBySala(idSala).isEmpty();
    }

    public boolean existsByHorario(String idHorario) {
        return !findByHorario(idHorario).isEmpty();
    }

    public boolean existsByCliente(Integer idCliente) {
        return !findByCliente(idCliente).isEmpty();
    }
}
