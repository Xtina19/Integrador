package ui.mantenimiento;

import model.Actividad;
import model.Entrenador;
import model.Localizacion;
import service.ActividadService;
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

public class ActividadMantenimientoFrame extends MantenimientoBaseFrame {

    private final ActividadService service = new ActividadService();

    private final JTextField txtId = new JTextField(12);
    private final JTextField txtNombre = new JTextField(20);
    private final JTextField txtDescripcion = new JTextField(24);
    private final JComboBox<ComboItem<Integer>> cboLocalizacion = new JComboBox<>();
    private final JComboBox<ComboItem<Integer>> cboEntrenador = new JComboBox<>();

    public ActividadMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Actividades",
                new String[]{"ID", "Nombre", "Descripción", "Localización", "Entrenador"});
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
        addField(form, gbc, 4, "Entrenador:", cboEntrenador);
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
        DefaultComboBoxModel<ComboItem<Integer>> locs = new DefaultComboBoxModel<>();
        for (Localizacion l : service.listarLocalizaciones()) {
            locs.addElement(new ComboItem<>(l.getIdLocalizacion(), l.getIdLocalizacion() + " - " + l.getTipo()));
        }
        cboLocalizacion.setModel(locs);

        DefaultComboBoxModel<ComboItem<Integer>> ents = new DefaultComboBoxModel<>();
        for (Entrenador e : service.listarEntrenadores()) {
            ents.addElement(new ComboItem<>(e.getIdEntrenador(),
                    e.getIdEntrenador() + " - " + e.getNombreCompleto().trim()));
        }
        cboEntrenador.setModel(ents);
    }

    private void buscarAutomatico() {
        if (txtId.getText().isBlank()) {
            return;
        }
        try {
            Optional<Actividad> opt = service.buscarPorId(txtId.getText());
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

    private void cargar(Actividad a) {
        txtId.setText(String.valueOf(a.getIdActividad()));
        txtNombre.setText(a.getNombreActividad());
        txtDescripcion.setText(a.getDescripcionActividad());
        seleccionar(cboLocalizacion, a.getIdLocalizacionActividad());
        seleccionar(cboEntrenador, a.getIdEntrenadorActividad());
    }

    private void seleccionar(JComboBox<ComboItem<Integer>> combo, Integer id) {
        for (int i = 0; i < combo.getItemCount(); i++) {
            ComboItem<Integer> item = combo.getItemAt(i);
            if (item != null && id.equals(item.getId())) {
                combo.setSelectedIndex(i);
                return;
            }
        }
    }

    private Actividad leerFormulario() {
        Actividad a = new Actividad();
        a.setIdActividad(Validators.requireInteger("ID Actividad", txtId.getText()));
        a.setNombreActividad(txtNombre.getText().trim());
        a.setDescripcionActividad(txtDescripcion.getText().trim());
        ComboItem<Integer> loc = (ComboItem<Integer>) cboLocalizacion.getSelectedItem();
        ComboItem<Integer> ent = (ComboItem<Integer>) cboEntrenador.getSelectedItem();
        if (loc == null) {
            throw new ValidationException("Localización", "seleccione una localización.");
        }
        if (ent == null) {
            throw new ValidationException("Entrenador", "seleccione un entrenador.");
        }
        a.setIdLocalizacionActividad(loc.getId());
        a.setIdEntrenadorActividad(ent.getId());
        return a;
    }

    private void limpiarExceptoId() {
        txtNombre.setText("");
        txtDescripcion.setText("");
        if (cboLocalizacion.getItemCount() > 0) {
            cboLocalizacion.setSelectedIndex(0);
        }
        if (cboEntrenador.getItemCount() > 0) {
            cboEntrenador.setSelectedIndex(0);
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
            Actividad a = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(a.getIdActividad()).isEmpty();
            service.guardar(a, creando);
            showInfo(creando ? "Actividad creada correctamente." : "Actividad modificada correctamente.");
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
                showWarn("Campo 'ID Actividad': es obligatorio para buscar.");
                return;
            }
            Optional<Actividad> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró la actividad con ID: " + txtId.getText().trim());
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
                showWarn("Campo 'ID Actividad': indique el registro a eliminar.");
                return;
            }
            Integer id = Validators.requireInteger("ID Actividad", txtId.getText());
            if (!confirm("¿Eliminar la actividad con ID " + id + "?")) {
                return;
            }
            service.eliminar(id);
            showInfo("Actividad eliminada correctamente.");
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
        service.buscarPorId(id).ifPresent(a -> {
            cargar(a);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        refrescarCombos();
        clearTable();
        for (Actividad a : service.listar()) {
            String loc = service.listarLocalizaciones().stream()
                    .filter(l -> l.getIdLocalizacion().equals(a.getIdLocalizacionActividad()))
                    .findFirst()
                    .map(l -> l.getIdLocalizacion() + " - " + l.getTipo())
                    .orElse(String.valueOf(a.getIdLocalizacionActividad()));
            String ent = service.listarEntrenadores().stream()
                    .filter(e -> e.getIdEntrenador().equals(a.getIdEntrenadorActividad()))
                    .findFirst()
                    .map(e -> e.getIdEntrenador() + " - " + e.getNombreCompleto().trim())
                    .orElse(String.valueOf(a.getIdEntrenadorActividad()));
            addTableRow(a.getIdActividad(), a.getNombreActividad(), a.getDescripcionActividad(), loc, ent);
        }
    }
}
