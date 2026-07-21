package ui.mantenimiento;

import model.Entrenador;
import service.EntrenadorService;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import validation.ValidationException;
import validation.Validators;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.Frame;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.util.Optional;

public class EntrenadorMantenimientoFrame extends MantenimientoBaseFrame {

    private final EntrenadorService service = new EntrenadorService();

    private final JTextField txtId = new JTextField(12);
    private final JTextField txtNombre = new JTextField(18);
    private final JTextField txtApellido = new JTextField(18);
    private final JTextField txtTelefono = new JTextField(14);
    private final JTextField txtCorreo = new JTextField(18);

    public EntrenadorMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Entrenadores",
                new String[]{"ID", "Nombre", "Apellido", "Teléfono", "Correo"});

        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtId.addActionListener(e -> buscarAutomatico());
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

        addField(form, gbc, 0, "ID:", txtId);
        addField(form, gbc, 1, "Nombre:", txtNombre);
        addField(form, gbc, 2, "Apellido:", txtApellido);
        addField(form, gbc, 3, "Teléfono:", txtTelefono);
        addField(form, gbc, 4, "Correo:", txtCorreo);
        return form;
    }

    private void addField(JPanel form, GridBagConstraints gbc, int row, String label, JTextField field) {
        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.weightx = 0;
        form.add(new JLabel(label), gbc);
        gbc.gridx = 1;
        gbc.weightx = 1;
        form.add(field, gbc);
    }

    private void buscarAutomatico() {
        String idTexto = txtId.getText().trim();
        if (idTexto.isEmpty()) {
            return;
        }
        try {
            Optional<Entrenador> opt = service.buscarPorId(idTexto);
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                limpiarCamposExceptoId();
                setModoCreando(true);
            }
        } catch (ValidationException ex) {
            // ID inválido: se deja en modo creando; Guardar validará de nuevo.
            setModoCreando(true);
        }
    }

    private void cargar(Entrenador e) {
        txtId.setText(String.valueOf(e.getIdEntrenador()));
        txtNombre.setText(e.getNombreEntrenador());
        txtApellido.setText(e.getApellidoEntrenador());
        txtTelefono.setText(e.getTelefonoEntrenador() == null ? "" : e.getTelefonoEntrenador());
        txtCorreo.setText(e.getCorreoEntrenador() == null ? "" : e.getCorreoEntrenador());
    }

    private Entrenador leerFormulario() {
        Entrenador e = new Entrenador();
        e.setIdEntrenador(Validators.requireInteger("ID Entrenador", txtId.getText()));
        e.setNombreEntrenador(txtNombre.getText().trim());
        e.setApellidoEntrenador(txtApellido.getText().trim());
        String tel = txtTelefono.getText().trim();
        String correo = txtCorreo.getText().trim();
        e.setTelefonoEntrenador(tel.isEmpty() ? null : tel);
        e.setCorreoEntrenador(correo.isEmpty() ? null : correo);
        return e;
    }

    private void limpiarCamposExceptoId() {
        txtNombre.setText("");
        txtApellido.setText("");
        txtTelefono.setText("");
        txtCorreo.setText("");
    }

    @Override
    protected void onNuevo() {
        onLimpiar();
        setModoCreando(true);
        txtId.requestFocusInWindow();
    }

    @Override
    protected void onGuardar() {
        try {
            Entrenador e = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(e.getIdEntrenador()).isEmpty();
            service.guardar(e, creando);
            showInfo(creando ? "Entrenador creado correctamente." : "Entrenador modificado correctamente.");
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
            if (txtId.getText().isBlank()) {
                showWarn("Campo 'ID Entrenador': es obligatorio para buscar.");
                return;
            }
            Optional<Entrenador> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró el entrenador con ID: " + txtId.getText().trim());
                setModoCreando(true);
            }
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    @Override
    protected void onEliminar() {
        try {
            if (txtId.getText().isBlank()) {
                showWarn("Campo 'ID Entrenador': indique el registro a eliminar.");
                return;
            }
            Integer id = Validators.requireInteger("ID Entrenador", txtId.getText());
            if (!confirm("¿Eliminar el entrenador con ID " + id + "?")) {
                return;
            }
            service.eliminar(id);
            showInfo("Entrenador eliminado correctamente.");
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
        txtId.setText("");
        limpiarCamposExceptoId();
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        Integer id = Integer.valueOf(String.valueOf(tableModel.getValueAt(row, 0)));
        service.buscarPorId(id).ifPresent(e -> {
            cargar(e);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        clearTable();
        for (Entrenador e : service.listar()) {
            addTableRow(
                    e.getIdEntrenador(),
                    e.getNombreEntrenador(),
                    e.getApellidoEntrenador(),
                    e.getTelefonoEntrenador() == null ? "" : e.getTelefonoEntrenador(),
                    e.getCorreoEntrenador() == null ? "" : e.getCorreoEntrenador()
            );
        }
    }
}
