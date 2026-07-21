package repository;

import config.AppConfig;
import model.DetalleCuota;
import model.EncabezadoCuota;
import repository.mapper.DetalleCuotaMapper;
import repository.mapper.EncabezadoCuotaMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Acceso a encabezados y detalles de cuotas.
 */
public class CuotaRepository {

    private final TxtRepository<EncabezadoCuota> encabezadoRepo;
    private final TxtRepository<DetalleCuota> detalleRepo;

    public CuotaRepository() {
        this.encabezadoRepo = new TxtRepository<>(AppConfig.encabezadoCuotasFile(), new EncabezadoCuotaMapper());
        this.detalleRepo = new TxtRepository<>(AppConfig.detalleCuotasFile(), new DetalleCuotaMapper());
    }

    public TxtRepository<EncabezadoCuota> encabezados() {
        return encabezadoRepo;
    }

    public TxtRepository<DetalleCuota> detalles() {
        return detalleRepo;
    }

    public Optional<EncabezadoCuota> findEncabezadoById(String idCuota) {
        return encabezadoRepo.findById(idCuota);
    }

    public List<EncabezadoCuota> findEncabezadosByFecha(LocalDate fecha) {
        return encabezadoRepo.findBy(e -> fecha.equals(e.getFechaCuota()));
    }

    public List<EncabezadoCuota> findEncabezadosByCliente(Integer idCliente) {
        return encabezadoRepo.findBy(e -> idCliente.equals(e.getIdClienteCuota()));
    }

    public List<DetalleCuota> findDetallesByCuota(String idCuota) {
        return detalleRepo.findBy(d -> idCuota.equalsIgnoreCase(d.getIdCuota()));
    }

    public void saveEncabezado(EncabezadoCuota encabezado) {
        encabezadoRepo.save(encabezado);
    }

    public void saveDetalle(DetalleCuota detalle) {
        detalleRepo.save(detalle);
    }

    public void saveDetalles(List<DetalleCuota> detalles) {
        detalleRepo.saveAll(detalles);
    }

    public boolean existsByCliente(Integer idCliente) {
        return !findEncabezadosByCliente(idCliente).isEmpty();
    }
}
