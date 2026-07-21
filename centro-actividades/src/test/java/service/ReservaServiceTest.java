package service;

import config.AppConfig;
import config.DataInitializer;
import model.Cliente;
import model.EstadoReservaIds;
import model.HorarioActividad;
import model.Reserva;
import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.AuditoriaRepository;
import validation.ValidationException;

import java.nio.file.Path;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReservaServiceTest {

    @TempDir
    Path tempDir;

    private ReservaService service;
    private LocalDate proximoLunes;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new DataInitializer().initialize();
        // Asegurar horario lunes 08:00
        HorarioActividadService hs = new HorarioActividadService();
        if (hs.buscarPorId("HOR-001").isEmpty()) {
            hs.guardar(new HorarioActividad("HOR-001", "Lunes", LocalTime.of(8, 0), 1), true);
        }
        service = new ReservaService();
        SessionContext.setCurrentUser(new Usuario("admin", "admin123", 0, "A", "G", null));
        proximoLunes = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        if (proximoLunes.isBefore(LocalDate.now())) {
            proximoLunes = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        }
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    private Reserva reservaBase(String id) {
        Reserva r = new Reserva();
        r.setIdReserva(id);
        r.setIdSalaReserva(1);
        r.setIdClienteReserva(1);
        r.setFechaReserva(proximoLunes);
        r.setIdHorarioReserva("HOR-001");
        r.setIdEstadoReserva(EstadoReservaIds.ACTIVA);
        return r;
    }

    @Test
    void crearReservaValida() {
        Reserva r = service.guardar(reservaBase("RES-1"), true);
        assertEquals("RES-1", r.getIdReserva());
        assertTrue(service.buscarPorId("RES-1").isPresent());
    }

    @Test
    void rechazarSalaInexistente() {
        Reserva r = reservaBase("RES-X");
        r.setIdSalaReserva(999);
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarClienteInexistente() {
        Reserva r = reservaBase("RES-X");
        r.setIdClienteReserva(999);
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarHorarioInexistente() {
        Reserva r = reservaBase("RES-X");
        r.setIdHorarioReserva("NO-EXISTE");
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarEstadoInexistente() {
        Reserva r = reservaBase("RES-X");
        r.setIdEstadoReserva("ZZZ");
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarClienteInactivo() {
        ClienteService cs = new ClienteService();
        Cliente inv = cs.buscarPorId(3).orElseThrow(); // invitado pasivo
        Reserva r = reservaBase("RES-X");
        r.setIdClienteReserva(inv.getIdCliente());
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarFechaPasada() {
        Reserva r = reservaBase("RES-X");
        r.setFechaReserva(LocalDate.now().minusDays(1));
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarDiaIncompatible() {
        // Martes con horario de lunes
        LocalDate martes = proximoLunes.plusDays(1);
        Reserva r = reservaBase("RES-X");
        r.setFechaReserva(martes);
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarDuplicadoActivoYPermitirTrasCancelacion() {
        service.guardar(reservaBase("RES-A"), true);
        assertThrows(ValidationException.class, () -> service.guardar(reservaBase("RES-B"), true));

        service.cancelar("RES-A", "libera cupo");
        Reserva nueva = service.guardar(reservaBase("RES-B"), true);
        assertEquals(EstadoReservaIds.ACTIVA, nueva.getIdEstadoReserva());
    }

    @Test
    void cancelarYRegistrarAuditoria() {
        service.guardar(reservaBase("RES-C"), true);
        service.cancelar("RES-C", "cliente no asiste");
        assertEquals(EstadoReservaIds.CANCELADA, service.buscarPorId("RES-C").orElseThrow().getIdEstadoReserva());
        assertFalse(new AuditoriaRepository().findAll().isEmpty());
    }

    @Test
    void rechazarEliminacionActiva() {
        service.guardar(reservaBase("RES-D"), true);
        assertThrows(ValidationException.class, () -> service.eliminar("RES-D"));
    }
}
