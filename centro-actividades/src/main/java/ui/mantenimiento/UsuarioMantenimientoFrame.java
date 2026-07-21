package ui.mantenimiento;

import model.Usuario;
import service.SessionContext;
import service.UsuarioService;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import validation.ValidationException;

import javax.swing.BorderFactory;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import java.awt.Frame;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.util.Optional;

public class UsuarioMantenimientoFrame extends MantenimientoBaseFrame {

    private final UsuarioService service = new UsuarioService();

    private final JTextField txtLogin = new JTextField(16);
    private final JPasswordField txtPass = new JPasswordField(16);
    private final JComboBox<String> cboNivel = new JComboBox<>(new String[]{
            "0 - Administrador", "1 - Usuario normal"
    });
    private final JTextField txtNombre = new JTextField(16);
    private final JTextField txtApellidos = new JTextField(16);
    private final JTextField txtCorreo = new JTextField(16);

    public UsuarioMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Usuarios",
                new String[]{"Login", "Nombre", "Apellidos", "Correo", "Nivel"});

        if (!SessionContext.isAdministrador()) {
            throw new IllegalStateException("Solo el administrador puede abrir este mantenimiento.");
        }

        txtLogin.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtLogin.addActionListener(e -> buscarAutomatico());
    }

    @Override
    protected JPanel buildFormPanel() {
        JPanel form = new JPanel(new GridBagLayout());
        form.setBackground(UiTheme.PANEL);
        form.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UiTheme.BORDER),
                BorderFactory.createEmptyBorder(12, 12, 12, 12)));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(4, 6, 4, 6);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        addField(form, gbc, 0, "Login:", txtLogin);
        addField(form, gbc, 1, "Contraseña:", txtPass);
        addField(form, gbc, 2, "Nivel:", cboNivel);
        addField(form, gbc, 3, "Nombre:", txtNombre);
        addField(form, gbc, 4, "Apellidos:", txtApellidos);
        addField(form, gbc, 5, "Correo:", txtCorreo);
        return form;
    }

    private void addField(JPanel form, GridBagConstraints gbc, int row, String label, java.awt.Component field) {
        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.weightx = 0;
        form.add(new JLabel(label), gbc);
        gbc.gridx = 1;
        gbc.weightx = 1;
        form.add(field, gbc);
    }

    private void buscarAutomatico() {
        String login = txtLogin.getText().trim();
        if (login.isEmpty()) {
            return;
        }
        Optional<Usuario> opt = service.buscarPorLogin(login);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            limpiarCamposExceptoId();
            setModoCreando(true);
        }
    }

    private void cargar(Usuario u) {
        txtLogin.setText(u.getLoginUsuario());
        txtPass.setText(u.getPassUsuario());
        cboNivel.setSelectedIndex(u.getNivelAcceso() != null && u.getNivelAcceso() == 0 ? 0 : 1);
        txtNombre.setText(u.getNombreUsuario());
        txtApellidos.setText(u.getApellidosUsuario());
        txtCorreo.setText(u.getCorreoUsuario() == null ? "" : u.getCorreoUsuario());
    }

    private Usuario leerFormulario() {
        Usuario u = new Usuario();
        u.setLoginUsuario(txtLogin.getText().trim());
        u.setPassUsuario(new String(txtPass.getPassword()));
        u.setNivelAcceso(cboNivel.getSelectedIndex() == 0 ? 0 : 1);
        u.setNombreUsuario(txtNombre.getText().trim());
        u.setApellidosUsuario(txtApellidos.getText().trim());
        String correo = txtCorreo.getText().trim();
        u.setCorreoUsuario(correo.isEmpty() ? null : correo);
        return u;
    }

    private void limpiarCamposExceptoId() {
        txtPass.setText("");
        cboNivel.setSelectedIndex(1);
        txtNombre.setText("");
        txtApellidos.setText("");
        txtCorreo.setText("");
    }

    @Override
    protected void onNuevo() {
        onLimpiar();
        setModoCreando(true);
        txtLogin.requestFocusInWindow();
    }

    @Override
    protected void onGuardar() {
        try {
            Usuario u = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorLogin(u.getLoginUsuario()).isEmpty();
            service.guardar(u, creando);
            showInfo(creando ? "Usuario creado correctamente." : "Usuario modificado correctamente.");
            setModoCreando(false);
            refrescarTabla();
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        } catch (Exception ex) {
            showError(ex.getMessage());
        }
    }

    @Override
    protected void onBuscar() {
        try {
            String login = txtLogin.getText().trim();
            if (login.isEmpty()) {
                showWarn("Campo 'Login': es obligatorio para buscar.");
                return;
            }
            Optional<Usuario> opt = service.buscarPorLogin(login);
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró el usuario con login: " + login);
                setModoCreando(true);
            }
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    @Override
    protected void onEliminar() {
        String login = txtLogin.getText().trim();
        if (login.isEmpty()) {
            showWarn("Campo 'Login': indique el usuario a eliminar.");
            return;
        }
        if (!confirm("¿Eliminar el usuario \"" + login + "\"?")) {
            return;
        }
        try {
            service.eliminar(login);
            showInfo("Usuario eliminado correctamente.");
            onLimpiar();
            refrescarTabla();
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        } catch (Exception ex) {
            showError(ex.getMessage());
        }
    }

    @Override
    protected void onLimpiar() {
        txtLogin.setText("");
        limpiarCamposExceptoId();
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        String login = String.valueOf(tableModel.getValueAt(row, 0));
        service.buscarPorLogin(login).ifPresent(u -> {
            cargar(u);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        clearTable();
        for (Usuario u : service.listar()) {
            addTableRow(
                    u.getLoginUsuario(),
                    u.getNombreUsuario(),
                    u.getApellidosUsuario(),
                    u.getCorreoUsuario() == null ? "" : u.getCorreoUsuario(),
                    u.getNivelDescripcion()
            );
        }
    }
}
