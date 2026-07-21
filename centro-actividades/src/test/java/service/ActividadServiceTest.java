package service;

import config.AppConfig;
import model.Actividad;
import model.Entrenador;
import model.HorarioActividad;
import model.Localizacion;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.EntrenadorRepository;
import repository.HorarioActividadRepository;
import repository.LocalizacionRepository;
import validation.ValidationException;

import java.nio.file.Path;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ActividadServiceTest {

    @TempDir
    Path tempDir;

    private ActividadService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new LocalizacionRepository().insert(new Localizacion(1, "Primer piso"));
        new EntrenadorRepository().insert(new Entrenador(1, "Carlos", "Mendez", null, null));
        service = new ActividadService();
        service.guardar(new Actividad(1, "Yoga", "Clase yoga", 1, 1), true);
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    @Test
    void crearActividadValida() {
        service.guardar(new Actividad(2, "Spinning", "Bike", 1, 1), true);
        assertTrue(service.buscarPorId(2).isPresent());
    }

    @Test
    void rechazarEntrenadorInexistente() {
        assertThrows(ValidationException.class,
                () -> service.guardar(new Actividad(3, "X", "Y", 1, 99), true));
    }

    @Test
    void rechazarLocalizacionInexistente() {
        assertThrows(ValidationException.class,
                () -> service.guardar(new Actividad(3, "X", "Y", 99, 1), true));
    }

    @Test
    void rechazarEliminacionConHorario() {
        new HorarioActividadRepository().insert(
                new HorarioActividad("HOR-1", "Lunes", LocalTime.of(8, 0), 1));
        assertThrows(ValidationException.class, () -> service.eliminar(1));
    }
}
