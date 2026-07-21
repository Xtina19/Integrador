package config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.ClienteRepository;
import repository.UsuarioRepository;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DataInitializerTest {

    @TempDir
    Path tempDir;

    @Test
    void seedsAdminAndSampleDataWithoutOverwrite() {
        AppConfig.setBaseDir(tempDir);
        try {
            DataInitializer initializer = new DataInitializer();
            initializer.initialize();
            initializer.initialize(); // segunda vez no debe duplicar

            UsuarioRepository usuarios = new UsuarioRepository();
            ClienteRepository clientes = new ClienteRepository();

            assertEquals(2, usuarios.count());
            assertTrue(usuarios.findByLogin("admin").isPresent());
            assertEquals("admin123", usuarios.findByLogin("admin").orElseThrow().getPassUsuario());
            assertTrue(usuarios.findByLogin("usuario").isPresent());
            assertEquals(3, clientes.count());
        } finally {
            AppConfig.setBaseDir(null);
        }
    }
}
