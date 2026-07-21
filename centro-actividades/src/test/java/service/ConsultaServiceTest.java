package service;

import config.AppConfig;
import config.DataInitializer;
import model.Sala;
import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.SalaRepository;
import service.dto.ConsultaResultado;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConsultaServiceTest {

    @TempDir
    Path tempDir;

    private ConsultaService service;
    private CobroService cobroService;
    private CuotaService cuotaService;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new DataInitializer().initialize();
        SessionContext.setCurrentUser(new Usuario("admin", "admin123", 0, "A", "G", null));
        service = new ConsultaService();
        cobroService = new CobroService();
        cuotaService = new CuotaService();
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    @Test
    void filtrarUsuariosPorLogin() {
        ConsultaResultado r = service.consultarUsuarios("adm", null, null, null, null);
        assertEquals(1, r.getCantidad());
        assertEquals("admin", r.getFilas().get(0)[0]);
    }

    @Test
    void ocultarContrasenaEnConsultaUsuarios() {
        ConsultaResultado r = service.consultarUsuarios(null, null, null, null, null);
        for (String col : r.getColumnas()) {
            assertFalse(col.toLowerCase().contains("pass") || col.toLowerCase().contains("contr"));
        }
        for (Object[] fila : r.getFilas()) {
            assertEquals(6, fila.length);
        }
    }

    @Test
    void usuarioNormalNoConsultaUsuarios() {
        SessionContext.setCurrentUser(new Usuario("usuario", "x", 1, "U", "N", null));
        assertThrows(ValidationException.class,
                () -> service.consultarUsuarios(null, null, null, null, null));
    }

    @Test
    void filtrarEntrenadoresPorNombre() {
        ConsultaResultado r = service.consultarEntrenadores(null, "car", null, null, null);
        assertTrue(r.getCantidad() >= 1);
        assertTrue(String.valueOf(r.getFilas().get(0)[1]).toLowerCase().contains("car")
                || String.valueOf(r.getFilas().get(0)[3]).toLowerCase().contains("car"));
    }

    @Test
    void resolverLocalizacionDeSala() {
        ConsultaResultado r = service.consultarSalas(null, null, null);
        assertTrue(r.getCantidad() >= 1);
        Object loc = r.getFilas().get(0)[4];
        assertTrue(String.valueOf(loc).contains(" - "));
    }

    @Test
    void resolverEntrenadorYLocalizacionDeActividad() {
        ConsultaResultado r = service.consultarActividades(null, null, null, null);
        assertTrue(r.getCantidad() >= 1);
        Object[] f = r.getFilas().get(0);
        assertTrue(String.valueOf(f[4]).contains(" - "));
        assertTrue(String.valueOf(f[6]).contains(" - "));
    }

    @Test
    void filtrarHorariosPorDia() {
        ConsultaResultado r = service.consultarHorarios(null, "Lunes", null, null);
        for (Object[] f : r.getFilas()) {
            assertTrue(String.valueOf(f[1]).toLowerCase().contains("lunes"));
            if (f[2] instanceof LocalTime) {
                assertTrue(true);
            }
        }
    }

    @Test
    void cobrosPorRangoValido() {
        cobroService.generarCobrosMensuales(7, 2026);
        ConsultaResultado r = service.consultarCobrosPorRango(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                null, null, 7, 2026);
        assertTrue(r.getCantidad() >= 2);
        assertTrue(r.getResumen().contains("valorCobro"));
    }

    @Test
    void rechazarRangoInvalido() {
        assertThrows(ValidationException.class, () ->
                service.consultarCobrosPorRango(LocalDate.of(2026, 7, 20),
                        LocalDate.of(2026, 7, 1), null, null, null, null));
    }

    @Test
    void cobrosPorClienteYResumenPendientes() {
        cobroService.generarCobrosMensuales(8, 2026);
        ConsultaResultado r = service.consultarCobrosPorCliente(1, false, null, null);
        assertTrue(r.getCantidad() >= 1);
        assertTrue(r.getResumen().contains("Total pendiente"));
        assertTrue(r.getResumen().contains("Balance actual"));
        for (Object[] f : r.getFilas()) {
            assertEquals("Pendiente", f[4]);
        }
    }

    @Test
    void cuotasPorFechaYDetalles() {
        cobroService.generarCobrosMensuales(6, 2026);
        cuotaService.registrarCuota("CUO-C1", 1, MoneyUtils.of(500), "Abono consulta");
        LocalDate hoy = DateUtils.today();
        ConsultaResultado enc = service.consultarCuotasPorFecha(hoy, null, null);
        assertTrue(enc.getCantidad() >= 1);
        assertTrue(enc.getResumen().contains("Total recibido"));

        ConsultaResultado det = service.consultarDetallesCuota("CUO-C1");
        assertTrue(det.getCantidad() >= 1);
        assertEquals(1, det.getFilas().get(0)[0]);
    }

    @Test
    void cuotasPorCliente() {
        cobroService.generarCobrosMensuales(6, 2026);
        cuotaService.registrarCuota("CUO-C2", 2, MoneyUtils.of(300), "Abono");
        ConsultaResultado r = service.consultarCuotasPorCliente(2, null, null, false);
        assertTrue(r.getCantidad() >= 1);
        assertTrue(r.getResumen().contains("Balance actual"));
    }

    @Test
    void filtrarClientesPorTipoYEstado() {
        ConsultaResultado r = service.consultarClientes(null, null, null, 1, true, null, null, null);
        assertTrue(r.getCantidad() >= 1);
        for (Object[] f : r.getFilas()) {
            assertEquals("Socio", f[8]);
            assertEquals("Activo", f[9]);
        }
        assertTrue(r.getResumen().contains("Socios"));
    }

    @Test
    void clientesConBalancePendienteOrdenYConteo() {
        cobroService.generarCobrosMensuales(9, 2026);
        ConsultaResultado r = service.consultarClientesConBalance(null, null, null, true, null);
        assertTrue(r.getCantidad() >= 2);
        BigDecimal prev = null;
        for (Object[] f : r.getFilas()) {
            BigDecimal bal = (BigDecimal) f[4];
            if (prev != null) {
                assertTrue(prev.compareTo(bal) >= 0);
            }
            prev = bal;
            assertTrue(bal.compareTo(BigDecimal.ZERO) > 0);
            assertTrue(((Number) f[6]).intValue() >= 1);
        }
        assertTrue(r.getResumen().contains("Mayor balance"));
    }

    @Test
    void manejoFkFaltante() {
        new SalaRepository().insert(new Sala(999, "Sala huérfana", "Sin loc", 99999));
        ConsultaResultado r = service.consultarSalas("999", null, null);
        assertEquals(1, r.getCantidad());
        assertTrue(String.valueOf(r.getFilas().get(0)[4]).contains("No encontrado"));
    }
}
