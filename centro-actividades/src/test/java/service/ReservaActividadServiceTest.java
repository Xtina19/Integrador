package service;

import config.AppConfig;
import config.DataInitializer;
import model.EstadoReservaIds;
import model.HorarioActividad;
import model.ReservaActividad;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReservaActividadServiceTest {

    @TempDir
    Path tempDir;

    private ReservaActividadService service;
    private LocalDate proximoLunes;
    private LocalDate proximoMartes;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new DataInitializer().initialize();
        HorarioActividadService hs = new HorarioActividadService();
        // HOR-001 Lunes act 1; HOR-003 Martes act 2
        if (hs.buscarPorId("HOR-001").isEmpty()) {
            hs.guardar(new HorarioActividad("HOR-001", "Lunes", LocalTime.of(8, 0), 1), true);
        }
        if (hs.buscarPorId("HOR-003").isEmpty()) {
            hs.guardar(new HorarioActividad("HOR-003", "Martes", LocalTime.of(7, 0), 2), true);
        }
        // segundo horario mismo día/hora distinta actividad para solapamiento
        if (hs.buscarPorId("HOR-SOL").isEmpty()) {
            try {
                hs.guardar(new HorarioActividad("HOR-SOL", "Lunes", LocalTime.of(8, 0), 3), true);
            } catch (Exception ignored) {
                // si act 3 no tiene o falla, crear en act 2 otro día
            }
        }
        service = new ReservaActividadService();
        SessionContext.setCurrentUser(new Usuario("admin", "admin123", 0, "A", "G", null));
        proximoLunes = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        if (proximoLunes.isBefore(LocalDate.now())) {
            proximoLunes = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        }
        proximoMartes = proximoLunes.plusDays(1);
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    private ReservaActividad base(int id) {
        ReservaActividad r = new ReservaActividad();
        r.setIdReservaActividad(id);
        r.setFechaReserva(proximoLunes);
        r.setIdEstadoReservaActividad(EstadoReservaIds.ACTIVA);
        r.setIdClienteReservaActividad(1);
        r.setIdActividad(1);
        r.setIdHorarioActividad("HOR-001");
        return r;
    }

    @Test
    void crearReservaValida() {
        ReservaActividad r = service.guardar(base(10), true);
        assertEquals(10, r.getIdReservaActividad());
    }

    @Test
    void rechazarActividadInexistente() {
        ReservaActividad r = base(11);
        r.setIdActividad(999);
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarHorarioDeOtraActividad() {
        ReservaActividad r = base(12);
        r.setIdActividad(1);
        r.setIdHorarioActividad("HOR-003"); // pertenece a actividad 2
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarClienteInactivo() {
        ReservaActividad r = base(13);
        r.setIdClienteReservaActividad(3);
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarFechaPasada() {
        ReservaActividad r = base(14);
        r.setFechaReserva(LocalDate.now().minusDays(2));
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarDiaIncompatible() {
        ReservaActividad r = base(15);
        r.setFechaReserva(proximoMartes);
        assertThrows(ValidationException.class, () -> service.guardar(r, true));
    }

    @Test
    void rechazarDuplicadoActivoYPermitirTrasCancelacion() {
        service.guardar(base(20), true);
        assertThrows(ValidationException.class, () -> service.guardar(base(21), true));
        service.cancelar(20, "libera");
        assertNotNull(service.buscarPorId(20).orElseThrow().getFechaBaja());
        service.guardar(base(21), true);
        assertTrue(service.buscarPorId(21).isPresent());
    }

    @Test
    void rechazarSolapamientoClienteMismaFechaHora() {
        // Crear horario misma hora lunes en otra actividad
        HorarioActividadService hs = new HorarioActividadService();
        hs.guardar(new HorarioActividad("HOR-SOL2", "Lunes", LocalTime.of(8, 0), 2), true);

        service.guardar(base(30), true);
        ReservaActividad otra = base(31);
        otra.setIdActividad(2);
        otra.setIdHorarioActividad("HOR-SOL2");
        assertThrows(ValidationException.class, () -> service.guardar(otra, true));
    }

    @Test
    void registrarAuditoriaAlCancelar() {
        service.guardar(base(40), true);
        service.cancelar(40, "motivo");
        assertEquals(EstadoReservaIds.CANCELADA,
                service.buscarPorId(40).orElseThrow().getIdEstadoReservaActividad());
        assertTrue(new AuditoriaRepository().findAll().stream()
                .anyMatch(a -> "CANCELAR".equals(a.getAccion())));
    }

    @Test
    void rechazarModificacionYEliminacionActiva() {
        service.guardar(base(50), true);
        service.cancelar(50, "x");
        ReservaActividad cancelada = service.buscarPorId(50).orElseThrow();
        cancelada.setIdClienteReservaActividad(2);
        assertThrows(ValidationException.class, () -> service.guardar(cancelada, false));

        service.guardar(base(51), true);
        assertThrows(ValidationException.class, () -> service.eliminar(51));
    }
}
