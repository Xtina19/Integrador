package config;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuración central del sistema.
 * Las rutas se resuelven respecto al directorio de trabajo del proceso.
 */
public final class AppConfig {

    public static final String APP_NAME = "Centro de Actividades";
    public static final String APP_VERSION = "1.0.0";
    public static final String FIELD_SEPARATOR = "|";
    public static final String DATE_PATTERN = "dd/MM/yyyy";
    public static final String DATE_TIME_PATTERN = "dd/MM/yyyy HH:mm:ss";

    private static Path overrideBaseDir;

    private AppConfig() {
    }

    /**
     * Permite apuntar a otro directorio base (útil en pruebas).
     * Pasar null para volver al directorio de trabajo del proceso.
     */
    public static void setBaseDir(Path baseDir) {
        overrideBaseDir = baseDir;
    }

    public static Path baseDir() {
        if (overrideBaseDir != null) {
            return overrideBaseDir.toAbsolutePath().normalize();
        }
        return Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
    }

    public static Path dataDir() {
        return baseDir().resolve("data");
    }

    public static Path outputDir() {
        return baseDir().resolve("output");
    }

    public static Path volantesDir() {
        return outputDir().resolve("volantes");
    }

    public static Path logsDir() {
        return baseDir().resolve("logs");
    }

    public static Path usuariosFile() {
        return dataDir().resolve("usuarios.txt");
    }

    public static Path entrenadoresFile() {
        return dataDir().resolve("entrenadores.txt");
    }

    public static Path localizacionesFile() {
        return dataDir().resolve("localizaciones.txt");
    }

    public static Path salasFile() {
        return dataDir().resolve("salas.txt");
    }

    public static Path actividadesFile() {
        return dataDir().resolve("actividades.txt");
    }

    public static Path horariosActividadesFile() {
        return dataDir().resolve("horarios_actividades.txt");
    }

    public static Path estadosReservaFile() {
        return dataDir().resolve("estados_reserva.txt");
    }

    public static Path clientesFile() {
        return dataDir().resolve("clientes.txt");
    }

    public static Path reservasFile() {
        return dataDir().resolve("reservas.txt");
    }

    public static Path reservasActividadesFile() {
        return dataDir().resolve("reservas_actividades.txt");
    }

    public static Path cobrosFile() {
        return dataDir().resolve("cobros.txt");
    }

    public static Path encabezadoCuotasFile() {
        return dataDir().resolve("encabezado_cuotas.txt");
    }

    public static Path detalleCuotasFile() {
        return dataDir().resolve("detalle_cuotas.txt");
    }

    public static Path auditoriaFile() {
        return dataDir().resolve("auditoria.txt");
    }
}
