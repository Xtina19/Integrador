package service;

import config.AppConfig;
import model.Localizacion;
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

class LocalizacionServiceTest {

    @TempDir
    Path tempDir;

    private LocalizacionService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        service = new LocalizacionService();
        service.guardar(new Localizacion(1, "Primer piso"), true);
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    @Test
    void crudBasico() {
        assertTrue(service.buscarPorId(1).isPresent());

        Localizacion l = new Localizacion(1, "Segundo piso");
        service.guardar(l, false);
        assertEquals("Segundo piso", service.buscarPorId(1).orElseThrow().getTipo());

        service.eliminar(1);
        assertFalse(service.buscarPorId(1).isPresent());
    }

    @Test
    void rechazaDuplicadoYTipoVacio() {
        assertThrows(ValidationException.class,
                () -> service.guardar(new Localizacion(1, "Otro"), true));
        assertThrows(ValidationException.class,
                () -> service.validar(new Localizacion(2, "  ")));
    }
}
