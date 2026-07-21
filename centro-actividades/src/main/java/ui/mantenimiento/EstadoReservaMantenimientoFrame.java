package ui.mantenimiento;

import model.EstadoReserva;
import service.EstadoReservaService;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import validation.ValidationException;

import javax.swing.BorderFactory;
import javax.swing.JComboBox;
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

public class EstadoReservaMantenimientoFrame extends MantenimientoBaseFrame {

    private final EstadoReservaService service = new EstadoReservaService();

    private final JTextField txtId = new JTextField(12);
    private final JComboBox<String> cboEstado = new JComboBox<>(new String[]{
            "true - Activa", "false - Inactiva"
    });
    private final JTextField txtDescripcion = new JTextField(20);

    public EstadoReservaMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Estados de Reserva",
                new String[]{"ID", "Estado", "Descripción"});

        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtId.addActionListener(e -> buscarAutomatico());

        cboEstado.addActionListener(e -> sugerirDescripcion());
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
        addField(form, gbc, 1, "Estado:", cboEstado);
        addField(form, gbc, 2, "Descripción:", txtDescripcion);

        gbc.gridx = 1;
        gbc.gridy = 3;
        JLabel hint = new JLabel("Ejemplos de descripción: Activa, Cancelada, Reversada, Finalizada");
        hint.setForeground(UiTheme.MUTED);
        form.add(hint, gbc);
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

    private void sugerirDescripcion() {
        if (!txtDescripcion.getText().isBlank()) {
            return;
        }
        txtDescripcion.setText(cboEstado.getSelectedIndex() == 0 ? "Activa" : "Inactiva");
    }

    private void buscarAutomatico() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            return;
        }
        Optional<EstadoReserva> opt = service.buscarPorId(id);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            cboEstado.setSelectedIndex(0);
            txtDescripcion.setText("");
            setModoCreando(true);
        }
    }

    private void cargar(EstadoReserva e) {
        txtId.setText(e.getIdEstadoReserva());
        cboEstado.setSelectedIndex(Boolean.TRUE.equals(e.getEstado()) ? 0 : 1);
        txtDescripcion.setText(e.getDescripcion() == null ? "" : e.getDescripcion());
    }

    private EstadoReserva leerFormulario() {
        EstadoReserva e = new EstadoReserva();
        e.setIdEstadoReserva(txtId.getText().trim());
        e.setEstado(cboEstado.getSelectedIndex() == 0);
        e.setDescripcion(txtDescripcion.getText().trim());
        return e;
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
            EstadoReserva e = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(e.getIdEstadoReserva()).isEmpty();
            service.guardar(e, creando);
            showInfo(creando ? "Estado creado correctamente." : "Estado modificado correctamente.");
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
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            showWarn("Campo 'ID Estado': es obligatorio para buscar.");
            return;
        }
        Optional<EstadoReserva> opt = service.buscarPorId(id);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            showWarn("No se encontró el estado con ID: " + id);
            setModoCreando(true);
        }
    }

    @Override
    protected void onEliminar() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            showWarn("Campo 'ID Estado': indique el registro a eliminar.");
            return;
        }
        if (!confirm("¿Eliminar el estado de reserva \"" + id + "\"?")) {
            return;
        }
        try {
            service.eliminar(id);
            showInfo("Estado eliminado correctamente.");
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
        cboEstado.setSelectedIndex(0);
        txtDescripcion.setText("");
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        String id = String.valueOf(tableModel.getValueAt(row, 0));
        service.buscarPorId(id).ifPresent(e -> {
            cargar(e);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        clearTable();
        for (EstadoReserva e : service.listar()) {
            addTableRow(
                    e.getIdEstadoReserva(),
                    Boolean.TRUE.equals(e.getEstado()) ? "Activa (true)" : "Inactiva (false)",
                    e.getDescripcion() == null ? "" : e.getDescripcion()
            );
        }
    }
}
