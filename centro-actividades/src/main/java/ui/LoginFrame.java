package ui;

import config.AppConfig;
import model.Usuario;
import service.AuthService;
import service.SessionContext;
import ui.component.UiTheme;
import validation.ValidationException;
import validation.Validators;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.WindowConstants;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;

public class LoginFrame extends JFrame {

    private final AuthService authService = new AuthService();

    private final JTextField txtLogin = new JTextField(18);
    private final JPasswordField txtPassword = new JPasswordField(18);
    private final JLabel lblUsuarioStatus = new JLabel(" ");
    private final JButton btnIngresar = new JButton("Ingresar");
    private final JButton btnRegistrarse = new JButton("Registrarse");

    private Usuario usuarioEncontrado;

    public LoginFrame() {
        super(AppConfig.APP_NAME + " - Inicio de sesión");
        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setSize(480, 340);
        setMinimumSize(new Dimension(440, 320));
        setLocationRelativeTo(null);
        setResizable(false);

        JPanel root = new JPanel(new BorderLayout(12, 12));
        root.setBackground(UiTheme.BG);
        root.setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));

        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);
        JLabel title = new JLabel(AppConfig.APP_NAME);
        title.setFont(UiTheme.TITLE);
        title.setForeground(UiTheme.PRIMARY);
        JLabel subtitle = new JLabel("Ingrese sus credenciales para continuar");
        subtitle.setFont(UiTheme.SUBTITLE);
        subtitle.setForeground(UiTheme.MUTED);
        header.add(title, BorderLayout.NORTH);
        header.add(subtitle, BorderLayout.SOUTH);

        JPanel form = new JPanel(new GridBagLayout());
        form.setBackground(UiTheme.PANEL);
        form.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UiTheme.BORDER),
                BorderFactory.createEmptyBorder(16, 16, 16, 16)));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(6, 6, 6, 6);
        gbc.anchor = GridBagConstraints.WEST;
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0;
        gbc.gridy = 0;
        form.add(label("Login:"), gbc);
        gbc.gridx = 1;
        form.add(txtLogin, gbc);

        gbc.gridx = 0;
        gbc.gridy = 1;
        form.add(label("Contraseña:"), gbc);
        gbc.gridx = 1;
        form.add(txtPassword, gbc);

        gbc.gridx = 1;
        gbc.gridy = 2;
        lblUsuarioStatus.setFont(UiTheme.LABEL);
        form.add(lblUsuarioStatus, gbc);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        actions.setOpaque(false);
        styleButton(btnIngresar, true);
        styleButton(btnRegistrarse, false);
        btnRegistrarse.setVisible(false);
        actions.add(btnRegistrarse);
        actions.add(btnIngresar);

        root.add(header, BorderLayout.NORTH);
        root.add(form, BorderLayout.CENTER);
        root.add(actions, BorderLayout.SOUTH);
        setContentPane(root);

        txtLogin.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                validarLoginCampo();
            }
        });
        txtLogin.addActionListener(e -> {
            validarLoginCampo();
            txtPassword.requestFocusInWindow();
        });
        txtPassword.addActionListener(e -> ingresar());
        btnIngresar.addActionListener(e -> ingresar());
        btnRegistrarse.addActionListener(e -> registrarNuevoUsuario());
    }

    private JLabel label(String text) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(UiTheme.LABEL);
        lbl.setForeground(UiTheme.TEXT);
        return lbl;
    }

    private void styleButton(JButton button, boolean primary) {
        button.setFont(UiTheme.BUTTON);
        button.setFocusPainted(false);
        button.setPreferredSize(new Dimension(120, 34));
        if (primary) {
            button.setBackground(UiTheme.ACCENT);
            button.setForeground(Color.WHITE);
            button.setOpaque(true);
            button.setBorderPainted(false);
        }
    }

    /**
     * Al salir del campo Login se valida existencia.
     * El botón Registrarse solo aparece si el login corresponde a un administrador.
     */
    private void validarLoginCampo() {
        String login = txtLogin.getText().trim();
        if (login.isEmpty()) {
            usuarioEncontrado = null;
            lblUsuarioStatus.setText(" ");
            btnRegistrarse.setVisible(false);
            return;
        }

        usuarioEncontrado = authService.buscarPorLogin(login).orElse(null);
        if (usuarioEncontrado != null) {
            lblUsuarioStatus.setForeground(UiTheme.ACCENT);
            lblUsuarioStatus.setText("Usuario encontrado: " + usuarioEncontrado.getNivelDescripcion());
            btnRegistrarse.setVisible(usuarioEncontrado.isAdministrador());
        } else {
            lblUsuarioStatus.setForeground(new Color(183, 28, 28));
            lblUsuarioStatus.setText("Usuario no registrado");
            btnRegistrarse.setVisible(false);
        }
        revalidate();
        repaint();
    }

    private void ingresar() {
        try {
            authService.login(txtLogin.getText(), new String(txtPassword.getPassword()));
            dispose();
            SwingUtilities.invokeLater(() -> new MainFrame().setVisible(true));
        } catch (ValidationException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Autenticación", JOptionPane.WARNING_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error inesperado: " + ex.getMessage(),
                    "Autenticación", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void registrarNuevoUsuario() {
        if (usuarioEncontrado == null || !usuarioEncontrado.isAdministrador()) {
            JOptionPane.showMessageDialog(this,
                    "Solo un administrador puede registrar usuarios.",
                    "Registro",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        String adminPass = new String(txtPassword.getPassword());
        if (adminPass.isBlank()) {
            JOptionPane.showMessageDialog(this,
                    "Ingrese la contraseña del administrador para registrar usuarios.",
                    "Registro",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        try {
            // Autentica temporalmente al admin para habilitar el registro.
            authService.login(usuarioEncontrado.getLoginUsuario(), adminPass);
        } catch (ValidationException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Registro", JOptionPane.WARNING_MESSAGE);
            return;
        }

        JTextField login = new JTextField();
        JPasswordField pass = new JPasswordField();
        JTextField nombre = new JTextField();
        JTextField apellidos = new JTextField();
        JTextField correo = new JTextField();
        JComboBox<String> nivel = new JComboBox<>(new String[]{"0 - Administrador", "1 - Usuario normal"});
        nivel.setSelectedIndex(1);

        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(4, 4, 4, 4);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridx = 0;
        gbc.gridy = 0;
        panel.add(new JLabel("Login:"), gbc);
        gbc.gridx = 1;
        panel.add(login, gbc);
        gbc.gridx = 0;
        gbc.gridy = 1;
        panel.add(new JLabel("Contraseña:"), gbc);
        gbc.gridx = 1;
        panel.add(pass, gbc);
        gbc.gridx = 0;
        gbc.gridy = 2;
        panel.add(new JLabel("Nombre:"), gbc);
        gbc.gridx = 1;
        panel.add(nombre, gbc);
        gbc.gridx = 0;
        gbc.gridy = 3;
        panel.add(new JLabel("Apellidos:"), gbc);
        gbc.gridx = 1;
        panel.add(apellidos, gbc);
        gbc.gridx = 0;
        gbc.gridy = 4;
        panel.add(new JLabel("Correo:"), gbc);
        gbc.gridx = 1;
        panel.add(correo, gbc);
        gbc.gridx = 0;
        gbc.gridy = 5;
        panel.add(new JLabel("Nivel:"), gbc);
        gbc.gridx = 1;
        panel.add(nivel, gbc);

        int op = JOptionPane.showConfirmDialog(this, panel, "Registrar usuario",
                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (op != JOptionPane.OK_OPTION) {
            authService.logout();
            return;
        }

        try {
            Usuario nuevo = new Usuario();
            nuevo.setLoginUsuario(Validators.requireText("Login", login.getText()));
            nuevo.setPassUsuario(Validators.requireText("Contraseña", new String(pass.getPassword())));
            nuevo.setNombreUsuario(Validators.requireText("Nombre", nombre.getText()));
            nuevo.setApellidosUsuario(Validators.requireText("Apellidos", apellidos.getText()));
            nuevo.setCorreoUsuario(correo.getText().isBlank() ? null : correo.getText().trim());
            nuevo.setNivelAcceso(nivel.getSelectedIndex() == 0 ? 0 : 1);
            authService.registrarUsuario(nuevo);
            JOptionPane.showMessageDialog(this, "Usuario registrado correctamente.",
                    "Registro", JOptionPane.INFORMATION_MESSAGE);
        } catch (RuntimeException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Registro", JOptionPane.WARNING_MESSAGE);
        } finally {
            // Volver a pantalla de login sin sesión abierta.
            authService.logout();
            SessionContext.clear();
        }
    }
}
