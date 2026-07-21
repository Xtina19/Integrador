package service;

import config.AppConfig;
import model.Localizacion;
import model.Reserva;
import model.Sala;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.LocalizacionRepository;
import repository.ReservaRepository;
import repository.SalaRepository;
import validation.ValidationException;

import java.nio.file.Path;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SalaServiceTest {

    @TempDir
    Path tempDir;

    private SalaService service;
    private ReservaRepository reservaRepository;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        new LocalizacionRepository().insert(new Localizacion(1, "Primer piso"));
        service = new SalaService();
        reservaRepository = new ReservaRepository();
        service.guardar(new Sala(1, "Sala A", "Descripcion A", 1), true);
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    @Test
    void crearSalaValida() {
        service.guardar(new Sala(2, "Sala B", "Desc B", 1), true);
        assertTrue(service.buscarPorId(2).isPresent());
    }

    @Test
    void rechazarLocalizacionInexistente() {
        assertThrows(ValidationException.class,
                () -> service.guardar(new Sala(3, "X", "Y", 99), true));
    }

    @Test
    void modificarSala() {
        Sala s = service.buscarPorId(1).orElseThrow();
        s.setNombreSala("Sala Renombrada");
        service.guardar(s, false);
        assertEquals("Sala Renombrada", service.buscarPorId(1).orElseThrow().getNombreSala());
    }

    @Test
    void rechazarEliminacionConReserva() {
        reservaRepository.insert(new Reserva("R1", 1, 1, LocalDate.now(), "HOR-001", "ACT"));
        assertThrows(ValidationException.class, () -> service.eliminar(1));
        assertTrue(new SalaRepository().existsById("1"));
    }
}
