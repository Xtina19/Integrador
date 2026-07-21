package service;

import config.AppConfig;
import config.DataInitializer;
import model.Cliente;
import model.Cobro;
import model.EncabezadoCuota;
import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.ClienteRepository;
import repository.CobroRepository;
import service.dto.ProcesoResultado;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;

import java.nio.file.Path;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CuotaServiceTest {

    @TempDir
    Path tempDir;

    private CobroService cobroService;
    private CuotaService cuotaService;
    private ClienteRepository clienteRepository;
    private CobroRepository cobroRepository;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new DataInitializer().initialize();
        SessionContext.setCurrentUser(new Usuario("admin", "admin123", 0, "A", "G", null));
        cobroService = new CobroService();
        cuotaService = new CuotaService();
        clienteRepository = new ClienteRepository();
        cobroRepository = new CobroRepository();
        cobroService.generarCobrosMensuales(6, 2026);
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    @Test
    void aplicacionParcialDeCuota() {
        // Cliente 1 balance 1500. Paga 1000.
        EncabezadoCuota e = cuotaService.registrarCuota("CUO-P1", 1, MoneyUtils.of(1000), "Abono parcial");
        assertTrue(!e.isAplicada());

        ProcesoResultado r = cuotaService.actualizarCuotasPorFecha(e.getFechaCuota());
        assertEquals(1, r.getProcesados());

        Cobro cobro = cobroRepository.findById("COB-06-2026-1").orElseThrow();
        assertEquals(0, cobro.getValorCobro().compareTo(MoneyUtils.of(500)));
        assertTrue(cobro.isPendiente());

        Cliente c = clienteRepository.findById(1).orElseThrow();
        assertEquals(0, c.getBalanceCliente().compareTo(MoneyUtils.of(500)));
    }

    @Test
    void aplicacionTotalDeCuota() {
        EncabezadoCuota e = cuotaService.registrarCuota("CUO-T1", 1, MoneyUtils.of(1500), "Pago total");
        cuotaService.actualizarCuotasPorFecha(e.getFechaCuota());

        Cobro cobro = cobroRepository.findById("COB-06-2026-1").orElseThrow();
        assertEquals(0, cobro.getValorCobro().compareTo(MoneyUtils.zero()));
        assertTrue(cobro.isSaldado());

        Cliente c = clienteRepository.findById(1).orElseThrow();
        assertEquals(0, c.getBalanceCliente().compareTo(MoneyUtils.zero()));
        assertTrue(cuotaService.buscarEncabezado("CUO-T1").orElseThrow().isAplicada());
    }

    @Test
    void rechazarCuotaMayorQueBalance() {
        assertThrows(ValidationException.class,
                () -> cuotaService.registrarCuota("CUO-X", 1, MoneyUtils.of(99999), "Exceso"));
    }

    @Test
    void noProcesarDosVeces() {
        EncabezadoCuota e = cuotaService.registrarCuota("CUO-2X", 2, MoneyUtils.of(1800), "Pago");
        cuotaService.actualizarCuotasPorFecha(e.getFechaCuota());
        assertThrows(ValidationException.class,
                () -> cuotaService.actualizarCuotasPorFecha(e.getFechaCuota()));
    }

    @Test
    void actualizacionBalanceDosCobros() {
        // Generar segundo mes para cliente 1 → balance 3000, dos cobros 1500
        cobroService.generarCobrosMensuales(7, 2026);
        EncabezadoCuota e = cuotaService.registrarCuota("CUO-FIFO", 1, MoneyUtils.of(2000), "FIFO");
        cuotaService.actualizarCuotasPorFecha(DateUtils.today());

        Cobro a = cobroRepository.findById("COB-06-2026-1").orElseThrow();
        Cobro b = cobroRepository.findById("COB-07-2026-1").orElseThrow();
        assertTrue(a.isSaldado());
        assertEquals(0, b.getValorCobro().compareTo(MoneyUtils.of(1000)));
        assertTrue(b.isPendiente());

        Cliente c = clienteRepository.findById(1).orElseThrow();
        assertEquals(0, c.getBalanceCliente().compareTo(MoneyUtils.of(1000)));
        assertTrue(cuotaService.listarDetalles("CUO-FIFO").size() >= 2);
    }

    @Test
    void fechaSinCuotasPendientes() {
        assertThrows(ValidationException.class,
                () -> cuotaService.actualizarCuotasPorFecha(LocalDate.of(2001, 1, 1)));
    }
}
