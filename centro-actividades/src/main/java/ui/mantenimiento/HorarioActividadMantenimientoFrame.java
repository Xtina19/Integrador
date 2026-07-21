package ui.mantenimiento;

import model.Actividad;
import model.HorarioActividad;
import service.HorarioActividadService;
import ui.component.ComboItem;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import validation.ValidationException;

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

public class HorarioActividadMantenimientoFrame extends MantenimientoBaseFrame {

    private static final String[] DIAS = {
            "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
    };

    private final HorarioActividadService service = new HorarioActividadService();

    private final JTextField txtId = new JTextField(14);
    private final JComboBox<String> cboDia = new JComboBox<>(DIAS);
    private final JTextField txtHora = new JTextField(8);
    private final JComboBox<ComboItem<Integer>> cboActividad = new JComboBox<>();

    public HorarioActividadMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Horarios de Actividades",
                new String[]{"ID", "Día", "Hora", "Actividad"});
        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtId.addActionListener(e -> buscarAutomatico());
        txtHora.setToolTipText("Formato HH:mm. Ejemplo: 08:00");
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
        addField(form, gbc, 1, "Día:", cboDia);
        addField(form, gbc, 2, "Hora (HH:mm):", txtHora);
        addField(form, gbc, 3, "Actividad:", cboActividad);
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
        for (Actividad a : service.listarActividades()) {
            model.addElement(new ComboItem<>(a.getIdActividad(),
                    a.getIdActividad() + " - " + a.getNombreActividad()));
        }
        cboActividad.setModel(model);
    }

    private void buscarAutomatico() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            return;
        }
        Optional<HorarioActividad> opt = service.buscarPorId(id);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            limpiarExceptoId();
            setModoCreando(true);
        }
    }

    private void cargar(HorarioActividad h) {
        txtId.setText(h.getIdHorarioActividad());
        cboDia.setSelectedItem(h.getDiaActividad());
        txtHora.setText(h.getHoraFormateada());
        for (int i = 0; i < cboActividad.getItemCount(); i++) {
            ComboItem<Integer> item = cboActividad.getItemAt(i);
            if (item != null && item.getId().equals(h.getIdActividad())) {
                cboActividad.setSelectedIndex(i);
                break;
            }
        }
    }

    private HorarioActividad leerFormulario() {
        HorarioActividad h = new HorarioActividad();
        h.setIdHorarioActividad(txtId.getText().trim());
        h.setDiaActividad(String.valueOf(cboDia.getSelectedItem()));
        h.setHoraActividad(service.parseHora(txtHora.getText()));
        ComboItem<Integer> act = (ComboItem<Integer>) cboActividad.getSelectedItem();
        if (act == null) {
            throw new ValidationException("Actividad", "seleccione una actividad.");
        }
        h.setIdActividad(act.getId());
        return h;
    }

    private void limpiarExceptoId() {
        cboDia.setSelectedIndex(0);
        txtHora.setText("");
        if (cboActividad.getItemCount() > 0) {
            cboActividad.setSelectedIndex(0);
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
            HorarioActividad h = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(h.getIdHorarioActividad()).isEmpty();
            service.guardar(h, creando);
            showInfo(creando ? "Horario creado correctamente." : "Horario modificado correctamente.");
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
            showWarn("Campo 'ID Horario': es obligatorio para buscar.");
            return;
        }
        Optional<HorarioActividad> opt = service.buscarPorId(id);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            showWarn("No se encontró el horario con ID: " + id);
            setModoCreando(true);
        }
    }

    @Override
    protected void onEliminar() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            showWarn("Campo 'ID Horario': indique el registro a eliminar.");
            return;
        }
        if (!confirm("¿Eliminar el horario \"" + id + "\"?")) {
            return;
        }
        try {
            service.eliminar(id);
            showInfo("Horario eliminado correctamente.");
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
        String id = String.valueOf(tableModel.getValueAt(row, 0));
        service.buscarPorId(id).ifPresent(h -> {
            cargar(h);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        refrescarCombos();
        clearTable();
        for (HorarioActividad h : service.listar()) {
            String act = service.buscarActividad(h.getIdActividad())
                    .map(a -> a.getIdActividad() + " - " + a.getNombreActividad())
                    .orElse(String.valueOf(h.getIdActividad()));
            addTableRow(h.getIdHorarioActividad(), h.getDiaActividad(), h.getHoraFormateada(), act);
        }
    }
}
