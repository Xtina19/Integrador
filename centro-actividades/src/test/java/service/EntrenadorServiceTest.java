package service;

import config.AppConfig;
import model.Entrenador;
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

class EntrenadorServiceTest {

    @TempDir
    Path tempDir;

    private EntrenadorService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        service = new EntrenadorService();
        service.guardar(new Entrenador(1, "Carlos", "Mendez", "8095551001", "c@t.com"), true);
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    @Test
    void crearBuscarModificarEliminar() {
        assertTrue(service.buscarPorId(1).isPresent());

        Entrenador e = service.buscarPorId(1).orElseThrow();
        e.setNombreEntrenador("Carlo");
        service.guardar(e, false);
        assertEquals("Carlo", service.buscarPorId(1).orElseThrow().getNombreEntrenador());

        service.eliminar(1);
        assertFalse(service.buscarPorId(1).isPresent());
    }

    @Test
    void rechazaIdDuplicado() {
        Entrenador dup = new Entrenador(1, "Ana", "Ruiz", null, null);
        assertThrows(ValidationException.class, () -> service.guardar(dup, true));
    }

    @Test
    void validaCamposObligatoriosYCorreo() {
        Entrenador sinNombre = new Entrenador(2, "", "X", null, null);
        assertThrows(ValidationException.class, () -> service.validar(sinNombre));

        Entrenador correoMalo = new Entrenador(2, "Ana", "Ruiz", null, "malo");
        assertThrows(ValidationException.class, () -> service.validar(correoMalo));
    }
}
