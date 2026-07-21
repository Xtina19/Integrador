package ui.mantenimiento;

import model.Localizacion;
import service.LocalizacionService;
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

public class LocalizacionMantenimientoFrame extends MantenimientoBaseFrame {

    private final LocalizacionService service = new LocalizacionService();

    private final JTextField txtId = new JTextField(12);
    private final JTextField txtTipo = new JTextField(24);

    public LocalizacionMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Localizaciones",
                new String[]{"ID", "Tipo"});

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

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 0;
        form.add(new JLabel("ID:"), gbc);
        gbc.gridx = 1;
        gbc.weightx = 1;
        form.add(txtId, gbc);

        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.weightx = 0;
        form.add(new JLabel("Tipo:"), gbc);
        gbc.gridx = 1;
        gbc.weightx = 1;
        form.add(txtTipo, gbc);

        gbc.gridx = 1;
        gbc.gridy = 2;
        JLabel hint = new JLabel("Ejemplos: Primer piso, Segundo piso, Área exterior");
        hint.setForeground(UiTheme.MUTED);
        form.add(hint, gbc);
        return form;
    }

    private void buscarAutomatico() {
        String idTexto = txtId.getText().trim();
        if (idTexto.isEmpty()) {
            return;
        }
        try {
            Optional<Localizacion> opt = service.buscarPorId(idTexto);
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                txtTipo.setText("");
                setModoCreando(true);
            }
        } catch (ValidationException ex) {
            setModoCreando(true);
        }
    }

    private void cargar(Localizacion l) {
        txtId.setText(String.valueOf(l.getIdLocalizacion()));
        txtTipo.setText(l.getTipo());
    }

    private Localizacion leerFormulario() {
        Localizacion l = new Localizacion();
        l.setIdLocalizacion(Validators.requireInteger("ID Localización", txtId.getText()));
        l.setTipo(txtTipo.getText().trim());
        return l;
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
            Localizacion l = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(l.getIdLocalizacion()).isEmpty();
            service.guardar(l, creando);
            showInfo(creando ? "Localización creada correctamente." : "Localización modificada correctamente.");
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
                showWarn("Campo 'ID Localización': es obligatorio para buscar.");
                return;
            }
            Optional<Localizacion> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró la localización con ID: " + txtId.getText().trim());
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
                showWarn("Campo 'ID Localización': indique el registro a eliminar.");
                return;
            }
            Integer id = Validators.requireInteger("ID Localización", txtId.getText());
            if (!confirm("¿Eliminar la localización con ID " + id + "?")) {
                return;
            }
            service.eliminar(id);
            showInfo("Localización eliminada correctamente.");
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
        txtTipo.setText("");
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        Integer id = Integer.valueOf(String.valueOf(tableModel.getValueAt(row, 0)));
        service.buscarPorId(id).ifPresent(l -> {
            cargar(l);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        clearTable();
        for (Localizacion l : service.listar()) {
            addTableRow(l.getIdLocalizacion(), l.getTipo());
        }
    }
}
