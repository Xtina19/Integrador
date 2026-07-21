package service;

import config.AppConfig;
import model.Actividad;
import model.Entrenador;
import model.HorarioActividad;
import model.Localizacion;
import model.Reserva;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.ActividadRepository;
import repository.EntrenadorRepository;
import repository.LocalizacionRepository;
import repository.ReservaRepository;
import validation.ValidationException;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HorarioActividadServiceTest {

    @TempDir
    Path tempDir;

    private HorarioActividadService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new LocalizacionRepository().insert(new Localizacion(1, "Primer piso"));
        new EntrenadorRepository().insert(new Entrenador(1, "Ana", "Ruiz", null, null));
        new ActividadRepository().insert(new Actividad(1, "Yoga", "Clase", 1, 1));
        service = new HorarioActividadService();
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    @Test
    void crearHorarioValido() {
        HorarioActividad h = new HorarioActividad("HOR-1", "Lunes", LocalTime.of(8, 0), 1);
        service.guardar(h, true);
        assertTrue(service.buscarPorId("HOR-1").isPresent());
        assertEquals(LocalTime.of(8, 0), service.buscarPorId("HOR-1").orElseThrow().getHoraActividad());
    }

    @Test
    void rechazarActividadInexistente() {
        HorarioActividad h = new HorarioActividad("HOR-2", "Lunes", LocalTime.of(9, 0), 99);
        assertThrows(ValidationException.class, () -> service.guardar(h, true));
    }

    @Test
    void rechazarDuplicadoActividadDiaHora() {
        service.guardar(new HorarioActividad("HOR-1", "Lunes", LocalTime.of(8, 0), 1), true);
        assertThrows(ValidationException.class,
                () -> service.guardar(new HorarioActividad("HOR-2", "Lunes", LocalTime.of(8, 0), 1), true));
    }

    @Test
    void validarFormatoHora() {
        assertThrows(ValidationException.class, () -> service.parseHora("25:99"));
        assertThrows(ValidationException.class, () -> service.parseHora("8am"));
        assertEquals(LocalTime.of(18, 30), service.parseHora("18:30"));
    }

    @Test
    void rechazarEliminacionConReserva() {
        service.guardar(new HorarioActividad("HOR-1", "Martes", LocalTime.of(7, 0), 1), true);
        new ReservaRepository().insert(new Reserva("R1", 1, 1, LocalDate.now(), "HOR-1", "ACT"));
        assertThrows(ValidationException.class, () -> service.eliminar("HOR-1"));
    }
}
