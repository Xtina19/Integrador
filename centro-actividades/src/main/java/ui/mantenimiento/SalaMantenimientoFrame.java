package ui.mantenimiento;

import model.Localizacion;
import model.Sala;
import service.SalaService;
import ui.component.ComboItem;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import validation.ValidationException;
import validation.Validators;

import javax.swing.BorderFactory;
import javax.swing.DefaultComboBoxModel;
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

public class SalaMantenimientoFrame extends MantenimientoBaseFrame {

    private final SalaService service = new SalaService();

    private final JTextField txtId = new JTextField(12);
    private final JTextField txtNombre = new JTextField(20);
    private final JTextField txtDescripcion = new JTextField(24);
    private final JComboBox<ComboItem<Integer>> cboLocalizacion = new JComboBox<>();

    public SalaMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Salas",
                new String[]{"ID", "Nombre", "Descripción", "Localización"});
        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtId.addActionListener(e -> buscarAutomatico());
        refrescarCombos();
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
        gbc.fill = GridBagConstraints.HORIZONTAL;
        addField(form, gbc, 0, "ID:", txtId);
        addField(form, gbc, 1, "Nombre:", txtNombre);
        addField(form, gbc, 2, "Descripción:", txtDescripcion);
        addField(form, gbc, 3, "Localización:", cboLocalizacion);
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

    private void refrescarCombos() {
        DefaultComboBoxModel<ComboItem<Integer>> model = new DefaultComboBoxModel<>();
        for (Localizacion l : service.listarLocalizaciones()) {
            model.addElement(new ComboItem<>(l.getIdLocalizacion(), l.getIdLocalizacion() + " - " + l.getTipo()));
        }
        cboLocalizacion.setModel(model);
    }

    private void buscarAutomatico() {
        if (txtId.getText().isBlank()) {
            return;
        }
        try {
            Optional<Sala> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                limpiarExceptoId();
                setModoCreando(true);
            }
        } catch (ValidationException ex) {
            setModoCreando(true);
        }
    }

    private void cargar(Sala s) {
        txtId.setText(String.valueOf(s.getIdSala()));
        txtNombre.setText(s.getNombreSala());
        txtDescripcion.setText(s.getDescripcionSala());
        seleccionarLocalizacion(s.getIdLocalizacionSala());
    }

    private void seleccionarLocalizacion(Integer id) {
        for (int i = 0; i < cboLocalizacion.getItemCount(); i++) {
            ComboItem<Integer> item = cboLocalizacion.getItemAt(i);
            if (item != null && id.equals(item.getId())) {
                cboLocalizacion.setSelectedIndex(i);
                return;
            }
        }
    }

    private Sala leerFormulario() {
        Sala s = new Sala();
        s.setIdSala(Validators.requireInteger("ID Sala", txtId.getText()));
        s.setNombreSala(txtNombre.getText().trim());
        s.setDescripcionSala(txtDescripcion.getText().trim());
        ComboItem<Integer> item = (ComboItem<Integer>) cboLocalizacion.getSelectedItem();
        if (item == null) {
            throw new ValidationException("Localización", "seleccione una localización del listado.");
        }
        s.setIdLocalizacionSala(item.getId());
        return s;
    }

    private void limpiarExceptoId() {
        txtNombre.setText("");
        txtDescripcion.setText("");
        if (cboLocalizacion.getItemCount() > 0) {
            cboLocalizacion.setSelectedIndex(0);
        }
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
            Sala s = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(s.getIdSala()).isEmpty();
            service.guardar(s, creando);
            showInfo(creando ? "Sala creada correctamente." : "Sala modificada correctamente.");
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
                showWarn("Campo 'ID Sala': es obligatorio para buscar.");
                return;
            }
            Optional<Sala> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró la sala con ID: " + txtId.getText().trim());
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
                showWarn("Campo 'ID Sala': indique el registro a eliminar.");
                return;
            }
            Integer id = Validators.requireInteger("ID Sala", txtId.getText());
            if (!confirm("¿Eliminar la sala con ID " + id + "?")) {
                return;
            }
            service.eliminar(id);
            showInfo("Sala eliminada correctamente.");
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
        limpiarExceptoId();
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        Integer id = Integer.valueOf(String.valueOf(tableModel.getValueAt(row, 0)));
        service.buscarPorId(id).ifPresent(s -> {
            cargar(s);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        refrescarCombos();
        clearTable();
        for (Sala s : service.listar()) {
            String loc = service.buscarLocalizacion(s.getIdLocalizacionSala())
                    .map(l -> l.getIdLocalizacion() + " - " + l.getTipo())
                    .orElse(String.valueOf(s.getIdLocalizacionSala()));
            addTableRow(s.getIdSala(), s.getNombreSala(), s.getDescripcionSala(), loc);
        }
    }
}
