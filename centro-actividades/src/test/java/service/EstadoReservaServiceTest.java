package service;

import config.AppConfig;
import model.EstadoReserva;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import validation.ValidationException;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EstadoReservaServiceTest {

    @TempDir
    Path tempDir;

    private EstadoReservaService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        service = new EstadoReservaService();
        service.guardar(new EstadoReserva("ACT", true, "Activa"), true);
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    @Test
    void crudBasico() {
        assertTrue(service.buscarPorId("ACT").isPresent());

        EstadoReserva e = service.buscarPorId("ACT").orElseThrow();
        e.setDescripcion("Activa vigente");
        service.guardar(e, false);
        assertEquals("Activa vigente", service.buscarPorId("ACT").orElseThrow().getDescripcion());

        service.eliminar("ACT");
        assertFalse(service.buscarPorId("ACT").isPresent());
    }

    @Test
    void rechazaDuplicadoYGeneraDescripcion() {
        assertThrows(ValidationException.class,
                () -> service.guardar(new EstadoReserva("ACT", false, "X"), true));

        EstadoReserva sinDesc = new EstadoReserva("CAN", false, null);
        service.validar(sinDesc);
        assertEquals("Inactiva", sinDesc.getDescripcion());
        assertEquals("CAN", sinDesc.getIdEstadoReserva());
    }
}
