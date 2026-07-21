package service;

import config.AppConfig;
import config.DataInitializer;
import model.Cliente;
import model.Cobro;
import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.ClienteRepository;
import repository.CobroRepository;
import service.dto.ProcesoResultado;
import util.MoneyUtils;
import validation.ValidationException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CobroServiceTest {

    @TempDir
    Path tempDir;

    private CobroService service;
    private ClienteRepository clienteRepository;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new DataInitializer().initialize();
        SessionContext.setCurrentUser(new Usuario("admin", "admin123", 0, "A", "G", null));
        service = new CobroService();
        clienteRepository = new ClienteRepository();
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    @Test
    void generarCobroYActualizarBalance() {
        ProcesoResultado r = service.generarCobrosMensuales(7, 2026);
        assertTrue(r.getProcesados() >= 2);
        assertTrue(r.getMontoTotal().compareTo(MoneyUtils.zero()) > 0);

        Cliente c1 = clienteRepository.findById(1).orElseThrow();
        assertEquals(0, c1.getBalanceCliente().compareTo(MoneyUtils.of(1500)));
        assertTrue(Files.isDirectory(service.carpetaVolantes(7, 2026)));
        assertTrue(service.buscarPorId("COB-07-2026-1").isPresent());
    }

    @Test
    void prevenirCobroDuplicado() {
        service.generarCobrosMensuales(7, 2026);
        ProcesoResultado r = service.generarCobrosMensuales(7, 2026);
        assertEquals(0, r.getProcesados());
        assertTrue(r.getOmitidos() >= 2);
    }

    @Test
    void reversarCobroYBalance() {
        service.generarCobrosMensuales(8, 2026);
        ProcesoResultado rev = service.reversarCobrosMensuales(8, 2026);
        assertTrue(rev.getProcesados() >= 2);
        Cliente c1 = clienteRepository.findById(1).orElseThrow();
        assertEquals(0, c1.getBalanceCliente().compareTo(MoneyUtils.zero()));
        assertFalse(service.buscarPorId("COB-08-2026-1").isPresent());
    }

    @Test
    void noReversarCobroSaldado() {
        service.generarCobrosMensuales(9, 2026);
        Cobro cobro = service.buscarPorId("COB-09-2026-1").orElseThrow();
        cobro.setValorCobro(MoneyUtils.zero());
        cobro.setStatusCobro(true);
        new CobroRepository().update(cobro);

        // El otro socio aún pendiente: proceso debe procesar parcial
        ProcesoResultado r = service.reversarCobrosMensuales(9, 2026);
        assertTrue(r.getErrores() >= 1);
        assertTrue(r.getProcesados() >= 1);
    }

    @Test
    void usuarioNormalNoPuedeGenerar() {
        SessionContext.setCurrentUser(new Usuario("usuario", "x", 1, "U", "N", null));
        assertThrows(ValidationException.class, () -> service.generarCobrosMensuales(1, 2026));
    }
}
