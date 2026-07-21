package service;

import config.AppConfig;
import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditoriaServiceTest {

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        SessionContext.setCurrentUser(new Usuario("admin", "x", 0, "A", "B", null));
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    @Test
    void registrarYListar() {
        AuditoriaService service = new AuditoriaService();
        assertTrue(service.registrar("CREAR", "Reserva", "R1", "prueba"));
        assertEquals(1, service.listar().size());
        assertEquals("admin", service.listar().get(0).getUsuario());
    }
}
