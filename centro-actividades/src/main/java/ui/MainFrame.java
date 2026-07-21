package ui;

import config.AppConfig;
import model.Usuario;
import service.AuthService;
import service.SessionContext;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import ui.mantenimiento.ActividadMantenimientoFrame;
import ui.mantenimiento.ClienteMantenimientoFrame;
import ui.mantenimiento.EntrenadorMantenimientoFrame;
import ui.mantenimiento.EstadoReservaMantenimientoFrame;
import ui.mantenimiento.HorarioActividadMantenimientoFrame;
import ui.mantenimiento.LocalizacionMantenimientoFrame;
import ui.mantenimiento.ReservaActividadMantenimientoFrame;
import ui.mantenimiento.ReservaMantenimientoFrame;
import ui.mantenimiento.SalaMantenimientoFrame;
import ui.mantenimiento.UsuarioMantenimientoFrame;
import ui.consulta.ConsultaActividadesFrame;
import ui.consulta.ConsultaClientesBalanceFrame;
import ui.consulta.ConsultaClientesFrame;
import ui.consulta.ConsultaCobrosClienteFrame;
import ui.consulta.ConsultaCobrosRangoFrame;
import ui.consulta.ConsultaCuotasClienteFrame;
import ui.consulta.ConsultaCuotasFechaFrame;
import ui.consulta.ConsultaEntrenadoresFrame;
import ui.consulta.ConsultaHorariosFrame;
import ui.consulta.ConsultaLocalizacionesFrame;
import ui.consulta.ConsultaSalasFrame;
import ui.consulta.ConsultaUsuariosFrame;
import ui.movimiento.CuotaMovimientoFrame;
import ui.proceso.ActualizarCuotaFrame;
import ui.proceso.GenerarCobroFrame;
import ui.proceso.ReversarCobroFrame;
import util.DateUtils;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.WindowConstants;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;

public class MainFrame extends JFrame {

    private final AuthService authService = new AuthService();

    private JMenuItem miUsuarios;
    private JMenuItem miGenerarCobro;
    private JMenuItem miReversarCobro;
    private JMenuItem miConsultaUsuarios;

    public MainFrame() {
        super(AppConfig.APP_NAME);
        if (!SessionContext.isAuthenticated()) {
            throw new IllegalStateException("No hay sesión activa.");
        }

        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setSize(960, 640);
        setMinimumSize(new Dimension(800, 520));
        setLocationRelativeTo(null);

        setJMenuBar(buildMenuBar());
        setContentPane(buildWelcomePanel());
        aplicarPermisos();
    }

    private JMenuBar buildMenuBar() {
        JMenuBar bar = new JMenuBar();

        JMenu mMantenimientos = new JMenu("Mantenimientos");
        miUsuarios = item("Usuarios", "mantenimiento.usuarios");
        mMantenimientos.add(miUsuarios);
        mMantenimientos.add(item("Entrenadores", "mantenimiento.entrenadores"));
        mMantenimientos.add(item("Localizaciones", "mantenimiento.localizaciones"));
        mMantenimientos.add(item("Salas", "mantenimiento.salas"));
        mMantenimientos.add(item("Actividades", "mantenimiento.actividades"));
        mMantenimientos.add(item("Horarios de actividades", "mantenimiento.horarios"));
        mMantenimientos.add(item("Clientes", "mantenimiento.clientes"));
        mMantenimientos.add(item("Estados de reservas", "mantenimiento.estados"));
        mMantenimientos.add(item("Reservas", "mantenimiento.reservas"));
        mMantenimientos.add(item("Reservas de actividades", "mantenimiento.reservasActividades"));

        JMenu mMovimientos = new JMenu("Movimientos");
        mMovimientos.add(item("Cuotas", "movimiento.cuotas"));

        JMenu mProcesos = new JMenu("Procesos");
        miGenerarCobro = item("Generar cobro", "proceso.generarCobro");
        miReversarCobro = item("Reversar cobro", "proceso.reversarCobro");
        mProcesos.add(miGenerarCobro);
        mProcesos.add(miReversarCobro);
        mProcesos.add(item("Actualizar cuota", "proceso.actualizarCuota"));

        JMenu mConsultas = new JMenu("Consultas");
        miConsultaUsuarios = item("Usuarios", "consulta.usuarios");
        mConsultas.add(miConsultaUsuarios);
        mConsultas.add(item("Entrenadores", "consulta.entrenadores"));
        mConsultas.add(item("Localizaciones", "consulta.localizaciones"));
        mConsultas.add(item("Salas", "consulta.salas"));
        mConsultas.add(item("Actividades", "consulta.actividades"));
        mConsultas.add(item("Horarios de actividades", "consulta.horarios"));
        mConsultas.add(item("Cobros por rango de fechas", "consulta.cobrosRango"));
        mConsultas.add(item("Cobros por cliente", "consulta.cobrosCliente"));
        mConsultas.add(item("Cuotas por fecha", "consulta.cuotasFecha"));
        mConsultas.add(item("Cuotas por cliente", "consulta.cuotasCliente"));
        mConsultas.add(item("Clientes", "consulta.clientes"));
        mConsultas.add(item("Clientes con balance pendiente", "consulta.clientesBalance"));

        JMenu mSesion = new JMenu("Sesión");
        JMenuItem miCerrar = new JMenuItem("Cerrar sesión");
        miCerrar.addActionListener(e -> cerrarSesion());
        JMenuItem miSalir = new JMenuItem("Salir");
        miSalir.addActionListener(e -> System.exit(0));
        mSesion.add(miCerrar);
        mSesion.addSeparator();
        mSesion.add(miSalir);

        bar.add(mMantenimientos);
        bar.add(mMovimientos);
        bar.add(mProcesos);
        bar.add(mConsultas);
        bar.add(mSesion);
        return bar;
    }

    private JMenuItem item(String texto, String clave) {
        JMenuItem item = new JMenuItem(texto);
        item.addActionListener(e -> abrirModulo(clave, texto));
        return item;
    }

    private void aplicarPermisos() {
        boolean admin = SessionContext.isAdministrador();
        miUsuarios.setEnabled(admin);
        miGenerarCobro.setEnabled(admin);
        miReversarCobro.setEnabled(admin);
        miConsultaUsuarios.setEnabled(admin);
    }

    private JPanel buildWelcomePanel() {
        Usuario u = SessionContext.getCurrentUser();

        JPanel root = new JPanel(new BorderLayout(16, 16));
        root.setBackground(UiTheme.BG);
        root.setBorder(BorderFactory.createEmptyBorder(24, 28, 24, 28));

        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);
        JLabel brand = new JLabel(AppConfig.APP_NAME);
        brand.setFont(UiTheme.TITLE);
        brand.setForeground(UiTheme.PRIMARY);
        JLabel welcome = new JLabel("Panel de bienvenida");
        welcome.setFont(UiTheme.SUBTITLE);
        welcome.setForeground(UiTheme.MUTED);
        header.add(brand, BorderLayout.NORTH);
        header.add(welcome, BorderLayout.SOUTH);

        JPanel info = new JPanel(new GridLayout(0, 1, 8, 8));
        info.setBackground(UiTheme.PANEL);
        info.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UiTheme.BORDER),
                BorderFactory.createEmptyBorder(20, 24, 20, 24)));

        info.add(infoLine("Usuario autenticado:", u.getLoginUsuario() + " — " + u.getNombreCompleto().trim()));
        info.add(infoLine("Nivel de acceso:", u.getNivelDescripcion() + " (" + u.getNivelAcceso() + ")"));
        info.add(infoLine("Fecha actual:", DateUtils.format(DateUtils.today())));
        info.add(infoLine("Estado:", "Sesión activa. Use el menú superior para navegar."));

        JPanel footer = new JPanel(new FlowLayout(FlowLayout.LEFT));
        footer.setOpaque(false);
        JLabel tip = new JLabel("Incluye cobros, cuotas y volantes PDF (Procesos / Movimientos).");
        tip.setForeground(UiTheme.MUTED);
        tip.setFont(new Font("Segoe UI", Font.ITALIC, 12));
        footer.add(tip);

        root.add(header, BorderLayout.NORTH);
        root.add(info, BorderLayout.CENTER);
        root.add(footer, BorderLayout.SOUTH);
        return root;
    }

    private JPanel infoLine(String label, String value) {
        JPanel row = new JPanel(new BorderLayout(12, 0));
        row.setOpaque(false);
        JLabel l = new JLabel(label);
        l.setFont(UiTheme.LABEL);
        l.setForeground(UiTheme.MUTED);
        l.setPreferredSize(new Dimension(180, 24));
        JLabel v = new JLabel(value);
        v.setFont(UiTheme.SUBTITLE);
        v.setForeground(UiTheme.TEXT);
        v.setHorizontalAlignment(SwingConstants.LEFT);
        row.add(l, BorderLayout.WEST);
        row.add(v, BorderLayout.CENTER);
        return row;
    }

    private void abrirModulo(String clave, String titulo) {
        switch (clave) {
            case "mantenimiento.usuarios" -> abrirUsuarios();
            case "mantenimiento.entrenadores" ->
                    MantenimientoBaseFrame.open(this, new EntrenadorMantenimientoFrame(this));
            case "mantenimiento.localizaciones" ->
                    MantenimientoBaseFrame.open(this, new LocalizacionMantenimientoFrame(this));
            case "mantenimiento.salas" ->
                    MantenimientoBaseFrame.open(this, new SalaMantenimientoFrame(this));
            case "mantenimiento.actividades" ->
                    MantenimientoBaseFrame.open(this, new ActividadMantenimientoFrame(this));
            case "mantenimiento.horarios" ->
                    MantenimientoBaseFrame.open(this, new HorarioActividadMantenimientoFrame(this));
            case "mantenimiento.clientes" ->
                    MantenimientoBaseFrame.open(this, new ClienteMantenimientoFrame(this));
            case "mantenimiento.estados" ->
                    MantenimientoBaseFrame.open(this, new EstadoReservaMantenimientoFrame(this));
            case "mantenimiento.reservas" ->
                    MantenimientoBaseFrame.open(this, new ReservaMantenimientoFrame(this));
            case "mantenimiento.reservasActividades" ->
                    MantenimientoBaseFrame.open(this, new ReservaActividadMantenimientoFrame(this));
            case "movimiento.cuotas" -> CuotaMovimientoFrame.open(this);
            case "proceso.generarCobro" -> {
                if (!SessionContext.isAdministrador()) {
                    JOptionPane.showMessageDialog(this, "Solo el administrador puede generar cobros.");
                } else {
                    GenerarCobroFrame.open(this);
                }
            }
            case "proceso.reversarCobro" -> {
                if (!SessionContext.isAdministrador()) {
                    JOptionPane.showMessageDialog(this, "Solo el administrador puede reversar cobros.");
                } else {
                    ReversarCobroFrame.open(this);
                }
            }
            case "proceso.actualizarCuota" -> ActualizarCuotaFrame.open(this);
            case "consulta.usuarios" -> ConsultaUsuariosFrame.open(this);
            case "consulta.entrenadores" -> ConsultaEntrenadoresFrame.open(this);
            case "consulta.localizaciones" -> ConsultaLocalizacionesFrame.open(this);
            case "consulta.salas" -> ConsultaSalasFrame.open(this);
            case "consulta.actividades" -> ConsultaActividadesFrame.open(this);
            case "consulta.horarios" -> ConsultaHorariosFrame.open(this);
            case "consulta.cobrosRango" -> ConsultaCobrosRangoFrame.open(this);
            case "consulta.cobrosCliente" -> ConsultaCobrosClienteFrame.open(this);
            case "consulta.cuotasFecha" -> ConsultaCuotasFechaFrame.open(this);
            case "consulta.cuotasCliente" -> ConsultaCuotasClienteFrame.open(this);
            case "consulta.clientes" -> ConsultaClientesFrame.open(this);
            case "consulta.clientesBalance" -> ConsultaClientesBalanceFrame.open(this);
            default -> JOptionPane.showMessageDialog(this,
                    "El módulo \"" + titulo + "\" no está disponible.\n"
                            + "Clave interna: " + clave,
                    "Módulo no disponible",
                    JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void abrirUsuarios() {
        if (!SessionContext.isAdministrador()) {
            JOptionPane.showMessageDialog(this,
                    "Acceso denegado. Solo el administrador puede abrir el mantenimiento de usuarios.",
                    "Usuarios",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        MantenimientoBaseFrame.open(this, new UsuarioMantenimientoFrame(this));
    }

    private void cerrarSesion() {
        int op = JOptionPane.showConfirmDialog(this,
                "¿Desea cerrar la sesión actual?",
                "Cerrar sesión",
                JOptionPane.YES_NO_OPTION);
        if (op != JOptionPane.YES_OPTION) {
            return;
        }
        authService.logout();
        dispose();
        SwingUtilities.invokeLater(() -> new LoginFrame().setVisible(true));
    }
}
