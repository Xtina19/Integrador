package config;

import model.Actividad;
import model.Cliente;
import model.Entrenador;
import model.EstadoReserva;
import model.HorarioActividad;
import model.Localizacion;
import model.Sala;
import model.Usuario;
import repository.ActividadRepository;
import repository.ClienteRepository;
import repository.EntrenadorRepository;
import repository.EstadoReservaRepository;
import repository.HorarioActividadRepository;
import repository.LocalizacionRepository;
import repository.SalaRepository;
import repository.UsuarioRepository;
import util.FileUtils;
import util.MoneyUtils;

import java.io.IOException;
import java.time.LocalDate;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Crea directorios, archivos y datos iniciales si aún no existen.
 * No sobrescribe información existente.
 */
public class DataInitializer {

    private static final Logger LOGGER = Logger.getLogger(DataInitializer.class.getName());

    private final UsuarioRepository usuarioRepository = new UsuarioRepository();
    private final EntrenadorRepository entrenadorRepository = new EntrenadorRepository();
    private final LocalizacionRepository localizacionRepository = new LocalizacionRepository();
    private final SalaRepository salaRepository = new SalaRepository();
    private final ActividadRepository actividadRepository = new ActividadRepository();
    private final HorarioActividadRepository horarioRepository = new HorarioActividadRepository();
    private final EstadoReservaRepository estadoReservaRepository = new EstadoReservaRepository();
    private final ClienteRepository clienteRepository = new ClienteRepository();

    public void initialize() {
        try {
            FileUtils.ensureDirectory(AppConfig.dataDir());
            FileUtils.ensureDirectory(AppConfig.outputDir());
            FileUtils.ensureDirectory(AppConfig.volantesDir());
            FileUtils.ensureDirectory(AppConfig.logsDir());

            FileUtils.ensureFile(AppConfig.usuariosFile());
            FileUtils.ensureFile(AppConfig.entrenadoresFile());
            FileUtils.ensureFile(AppConfig.localizacionesFile());
            FileUtils.ensureFile(AppConfig.salasFile());
            FileUtils.ensureFile(AppConfig.actividadesFile());
            FileUtils.ensureFile(AppConfig.horariosActividadesFile());
            FileUtils.ensureFile(AppConfig.estadosReservaFile());
            FileUtils.ensureFile(AppConfig.clientesFile());
            FileUtils.ensureFile(AppConfig.reservasFile());
            FileUtils.ensureFile(AppConfig.reservasActividadesFile());
            FileUtils.ensureFile(AppConfig.cobrosFile());
            FileUtils.ensureFile(AppConfig.encabezadoCuotasFile());
            FileUtils.ensureFile(AppConfig.detalleCuotasFile());
            FileUtils.ensureFile(AppConfig.auditoriaFile());

            seedUsuarios();
            seedLocalizaciones();
            seedEntrenadores();
            seedSalas();
            seedActividades();
            seedHorarios();
            seedEstadosReserva();
            seedClientes();

            LOGGER.info("Inicialización de datos completada.");
        } catch (IOException ex) {
            throw new IllegalStateException("No se pudo inicializar el almacenamiento: " + ex.getMessage(), ex);
        }
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() > 0) {
            return;
        }
        Usuario admin = new Usuario(
                "admin",
                "admin123",
                0,
                "Administrador",
                "General",
                "admin@sistema.local"
        );
        usuarioRepository.insert(admin);

        Usuario normal = new Usuario(
                "usuario",
                "usuario123",
                1,
                "Usuario",
                "Operativo",
                "usuario@sistema.local"
        );
        usuarioRepository.insert(normal);
        LOGGER.info("Usuarios iniciales: admin/admin123 y usuario/usuario123");
    }

    private void seedLocalizaciones() {
        if (localizacionRepository.count() > 0) {
            return;
        }
        localizacionRepository.insert(new Localizacion(1, "Primer piso"));
        localizacionRepository.insert(new Localizacion(2, "Área exterior"));
    }

    private void seedEntrenadores() {
        if (entrenadorRepository.count() > 0) {
            return;
        }
        entrenadorRepository.insert(new Entrenador(1, "Carlos", "Méndez", "8095551001", "carlos@centro.local"));
        entrenadorRepository.insert(new Entrenador(2, "Ana", "Ruiz", "8095551002", "ana@centro.local"));
    }

    private void seedSalas() {
        if (salaRepository.count() > 0) {
            return;
        }
        salaRepository.insert(new Sala(1, "Sala Cardio", "Equipos cardiovasculares", 1));
        salaRepository.insert(new Sala(2, "Sala Yoga", "Espacio para actividades de bajo impacto", 2));
    }

    private void seedActividades() {
        if (actividadRepository.count() > 0) {
            return;
        }
        actividadRepository.insert(new Actividad(1, "Spinning", "Clase de ciclismo indoor", 1, 1));
        actividadRepository.insert(new Actividad(2, "Yoga", "Sesión de yoga matutina", 2, 2));
        actividadRepository.insert(new Actividad(3, "CrossFit", "Entrenamiento funcional", 1, 1));
    }

    private void seedHorarios() {
        if (horarioRepository.count() > 0) {
            return;
        }
        horarioRepository.insert(new HorarioActividad("HOR-001", "Lunes", "08:00", 1));
        horarioRepository.insert(new HorarioActividad("HOR-002", "Miércoles", "18:00", 1));
        horarioRepository.insert(new HorarioActividad("HOR-003", "Martes", "07:00", 2));
        horarioRepository.insert(new HorarioActividad("HOR-004", "Jueves", "19:00", 3));
        horarioRepository.insert(new HorarioActividad("HOR-005", "Viernes", "17:00", 3));
    }

    private void seedEstadosReserva() {
        if (estadoReservaRepository.count() > 0) {
            return;
        }
        estadoReservaRepository.insert(new EstadoReserva("ACT", true, "Activa"));
        estadoReservaRepository.insert(new EstadoReserva("CAN", false, "Cancelada"));
        estadoReservaRepository.insert(new EstadoReserva("REV", false, "Reversada"));
        estadoReservaRepository.insert(new EstadoReserva("FIN", false, "Finalizada"));
    }

    private void seedClientes() {
        if (clienteRepository.count() > 0) {
            return;
        }

        Cliente socio1 = new Cliente();
        socio1.setIdCliente(1);
        socio1.setNombreCliente("Luis");
        socio1.setApellidoPaternoCliente("Pérez");
        socio1.setApellidoMaternoCliente("Gómez");
        socio1.setDireccionCliente("Calle Primera #10");
        socio1.setFechaNacimientoCliente(LocalDate.of(1990, 5, 12));
        socio1.setTelefonoCliente("8095552001");
        socio1.setCelularCliente("8295552001");
        socio1.setFechaIngreso(LocalDate.now());
        socio1.setStatusCliente(true);
        socio1.setTipoCliente(Cliente.TIPO_SOCIO);
        socio1.setCorreoCliente("luis@cliente.local");
        socio1.setBalanceCliente(MoneyUtils.zero());
        socio1.setValorCuotaCliente(MoneyUtils.of(1500.00));
        clienteRepository.insert(socio1);

        Cliente socio2 = new Cliente();
        socio2.setIdCliente(2);
        socio2.setNombreCliente("María");
        socio2.setApellidoPaternoCliente("Santos");
        socio2.setApellidoMaternoCliente("Díaz");
        socio2.setDireccionCliente("Av. Central #25");
        socio2.setFechaNacimientoCliente(LocalDate.of(1988, 11, 3));
        socio2.setTelefonoCliente("8095552002");
        socio2.setCelularCliente("8295552002");
        socio2.setFechaIngreso(LocalDate.now());
        socio2.setStatusCliente(true);
        socio2.setTipoCliente(Cliente.TIPO_SOCIO);
        socio2.setCorreoCliente("maria@cliente.local");
        socio2.setBalanceCliente(MoneyUtils.zero());
        socio2.setValorCuotaCliente(MoneyUtils.of(1800.00));
        clienteRepository.insert(socio2);

        Cliente invitado = new Cliente();
        invitado.setIdCliente(3);
        invitado.setNombreCliente("Pedro");
        invitado.setApellidoPaternoCliente("Lopez");
        invitado.setApellidoMaternoCliente("Reyes");
        invitado.setDireccionCliente("Calle Sur #8");
        invitado.setFechaNacimientoCliente(LocalDate.of(1995, 2, 20));
        invitado.setTelefonoCliente("8095552003");
        invitado.setCelularCliente("8295552003");
        invitado.setFechaIngreso(LocalDate.now());
        invitado.setStatusCliente(false);
        invitado.setTipoCliente(Cliente.TIPO_INVITADO);
        invitado.setCorreoCliente("pedro@cliente.local");
        invitado.setBalanceCliente(MoneyUtils.zero());
        invitado.setValorCuotaCliente(MoneyUtils.zero());
        clienteRepository.insert(invitado);

        LOGGER.log(Level.INFO, "Clientes de prueba creados: 2 socios activos, 1 invitado pasivo.");
    }
}
