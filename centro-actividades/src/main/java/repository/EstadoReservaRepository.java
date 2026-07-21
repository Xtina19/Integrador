package repository;

import config.AppConfig;
import model.EstadoReserva;
import repository.mapper.EstadoReservaMapper;

public class EstadoReservaRepository extends TxtRepository<EstadoReserva> {

    public EstadoReservaRepository() {
        super(AppConfig.estadosReservaFile(), new EstadoReservaMapper());
    }
}
