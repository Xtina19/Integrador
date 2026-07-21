package ui.mantenimiento;

import model.Actividad;
import model.Cliente;
import model.EstadoReserva;
import model.EstadoReservaIds;
import model.HorarioActividad;
import model.ReservaActividad;
import service.ReservaActividadService;
import service.SessionContext;
import ui.component.ComboItem;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import util.DateUtils;
import validation.ValidationException;

import javax.swing.BorderFactory;
import javax.swing.DefaultComboBoxModel;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.Dimension;
import java.awt.Frame;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public class ReservaActividadMantenimientoFrame extends MantenimientoBaseFrame {

    private final ReservaActividadService service = new ReservaActividadService();

    private final JTextField txtId = new JTextField(10);
    private final JTextField txtFecha = new JTextField(12);
    private final JTextField txtFechaBaja = new JTextField(12);
    private final JComboBox<ComboItem<String>> cboEstado = new JComboBox<>();
    private final JComboBox<ComboItem<Integer>> cboCliente = new JComboBox<>();
    private final JComboBox<ComboItem<Integer>> cboActividad = new JComboBox<>();
    private final JComboBox<ComboItem<String>> cboHorario = new JComboBox<>();
    private final JLabel lblDia = new JLabel(" ");

    private final JButton btnCancelar = new JButton("Cancelar");
    private final JButton btnReversar = new JButton("Reversar");

    private boolean cargando = false;

    public ReservaActividadMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Reservas de Actividades",
                new String[]{"ID", "Fecha", "Fecha baja", "Cliente", "Actividad", "Horario", "Estado"});
        setSize(940, 620);

        txtFechaBaja.setEditable(false);
        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtId.addActionListener(e -> buscarAutomatico());
        txtFecha.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                onFiltrosCambiados();
            }
        });
        txtFecha.addActionListener(e -> onFiltrosCambiados());
        cboActividad.addActionListener(e -> {
            if (!cargando) {
                onFiltrosCambiados();
            }
        });

        btnCancelar.addActionListener(e -> onCancelar());
        btnReversar.addActionListener(e -> onReversar());
        btnReversar.setEnabled(SessionContext.isAdministrador());
        btnEliminar.setEnabled(SessionContext.isAdministrador());

        refrescarCombosBase();
        recargarHorarios(null);
    }

    @Override
    protected void addExtraButtons(JPanel panel, Dimension size) {
        styleActionButton(btnCancelar, size);
        styleActionButton(btnReversar, size);
        panel.add(btnCancelar);
        panel.add(btnReversar);
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
        addField(form, gbc, 1, "Fecha (dd/MM/yyyy):", txtFecha);
        gbc.gridx = 1;
        gbc.gridy = 2;
        lblDia.setForeground(UiTheme.MUTED);
        form.add(lblDia, gbc);
        addField(form, gbc, 3, "Fecha baja:", txtFechaBaja);
        addField(form, gbc, 4, "Estado:", cboEstado);
        addField(form, gbc, 5, "Cliente:", cboCliente);
        addField(form, gbc, 6, "Actividad:", cboActividad);
        addField(form, gbc, 7, "Horario:", cboHorario);
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

    private void refrescarCombosBase() {
        DefaultComboBoxModel<ComboItem<Integer>> clientes = new DefaultComboBoxModel<>();
        for (Cliente c : service.listarClientes()) {
            clientes.addElement(new ComboItem<>(c.getIdCliente(),
                    c.getIdCliente() + " - " + c.getNombreCompleto()));
        }
        cboCliente.setModel(clientes);

        DefaultComboBoxModel<ComboItem<Integer>> acts = new DefaultComboBoxModel<>();
        for (Actividad a : service.listarActividades()) {
            acts.addElement(new ComboItem<>(a.getIdActividad(),
                    a.getIdActividad() + " - " + a.getNombreActividad()));
        }
        cboActividad.setModel(acts);

        DefaultComboBoxModel<ComboItem<String>> estados = new DefaultComboBoxModel<>();
        for (EstadoReserva e : service.listarEstados()) {
            estados.addElement(new ComboItem<>(e.getIdEstadoReserva(),
                    e.getIdEstadoReserva() + " - " + e.getDescripcion()));
        }
        cboEstado.setModel(estados);
        seleccionarEstado(EstadoReservaIds.ACTIVA);
    }

    private void onFiltrosCambiados() {
        LocalDate fecha = DateUtils.parseDate(txtFecha.getText()).orElse(null);
        if (fecha != null) {
            lblDia.setText("Día: " + DateUtils.diaSemanaEspanol(fecha));
        } else {
            lblDia.setText(" ");
        }
        String horarioPrev = selectedHorarioId();
        recargarHorarios(horarioPrev);
    }

    private void recargarHorarios(String preferido) {
        ComboItem<Integer> act = (ComboItem<Integer>) cboActividad.getSelectedItem();
        Integer idAct = act == null ? null : act.getId();
        LocalDate fecha = DateUtils.parseDate(txtFecha.getText()).orElse(null);
        List<HorarioActividad> horarios = service.listarHorariosPorActividadYFecha(idAct, fecha);

        DefaultComboBoxModel<ComboItem<String>> model = new DefaultComboBoxModel<>();
        for (HorarioActividad h : horarios) {
            model.addElement(new ComboItem<>(h.getIdHorarioActividad(),
                    h.getIdHorarioActividad() + " - " + h.getDiaActividad() + " " + h.getHoraFormateada()));
        }
        cboHorario.setModel(model);
        if (preferido != null) {
            boolean ok = seleccionarHorario(preferido);
            if (!ok && model.getSize() > 0) {
                // selección inválida limpiada
            }
        } else if (model.getSize() == 0) {
            cboHorario.setSelectedIndex(-1);
        }
    }

    private void buscarAutomatico() {
        if (txtId.getText().isBlank()) {
            return;
        }
        try {
            Optional<ReservaActividad> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                prepararNuevoParcial();
                setModoCreando(true);
            }
        } catch (ValidationException ex) {
            setModoCreando(true);
        }
    }

    private void prepararNuevoParcial() {
        txtFecha.setText("");
        txtFechaBaja.setText("");
        lblDia.setText(" ");
        seleccionarEstado(EstadoReservaIds.ACTIVA);
        if (cboCliente.getItemCount() > 0) {
            cboCliente.setSelectedIndex(0);
        }
        if (cboActividad.getItemCount() > 0) {
            cboActividad.setSelectedIndex(0);
        }
        recargarHorarios(null);
    }

    private void cargar(ReservaActividad r) {
        cargando = true;
        try {
            txtId.setText(String.valueOf(r.getIdReservaActividad()));
            txtFecha.setText(DateUtils.format(r.getFechaReserva()));
            txtFechaBaja.setText(DateUtils.format(r.getFechaBaja()));
            lblDia.setText("Día: " + DateUtils.diaSemanaEspanol(r.getFechaReserva()));
            seleccionarEstado(r.getIdEstadoReservaActividad());
            seleccionarInt(cboCliente, r.getIdClienteReservaActividad());
            seleccionarInt(cboActividad, r.getIdActividad());
            recargarHorarios(r.getIdHorarioActividad());
        } finally {
            cargando = false;
        }
    }

    private ReservaActividad leerFormulario() {
        ReservaActividad r = new ReservaActividad();
        r.setIdReservaActividad(Integer.parseInt(txtId.getText().trim()));
        r.setFechaReserva(DateUtils.parseDate(txtFecha.getText()).orElseThrow(() ->
                new ValidationException("Fecha", "debe tener formato dd/MM/yyyy.")));
        ComboItem<String> est = (ComboItem<String>) cboEstado.getSelectedItem();
        ComboItem<Integer> cli = (ComboItem<Integer>) cboCliente.getSelectedItem();
        ComboItem<Integer> act = (ComboItem<Integer>) cboActividad.getSelectedItem();
        ComboItem<String> hor = (ComboItem<String>) cboHorario.getSelectedItem();
        if (est == null || cli == null || act == null || hor == null) {
            throw new ValidationException("Formulario", "complete estado, cliente, actividad y horario.");
        }
        r.setIdEstadoReservaActividad(est.getId());
        r.setIdClienteReservaActividad(cli.getId());
        r.setIdActividad(act.getId());
        r.setIdHorarioActividad(hor.getId());
        return r;
    }

    private String selectedHorarioId() {
        ComboItem<String> hor = (ComboItem<String>) cboHorario.getSelectedItem();
        return hor == null ? null : hor.getId();
    }

    private void seleccionarInt(JComboBox<ComboItem<Integer>> combo, Integer id) {
        for (int i = 0; i < combo.getItemCount(); i++) {
            if (combo.getItemAt(i).getId().equals(id)) {
                combo.setSelectedIndex(i);
                return;
            }
        }
    }

    private boolean seleccionarHorario(String id) {
        for (int i = 0; i < cboHorario.getItemCount(); i++) {
            if (cboHorario.getItemAt(i).getId().equalsIgnoreCase(id)) {
                cboHorario.setSelectedIndex(i);
                return true;
            }
        }
        return false;
    }

    private void seleccionarEstado(String id) {
        for (int i = 0; i < cboEstado.getItemCount(); i++) {
            if (cboEstado.getItemAt(i).getId().equalsIgnoreCase(id)) {
                cboEstado.setSelectedIndex(i);
                return;
            }
        }
    }

    private void onCancelar() {
        try {
            if (txtId.getText().isBlank()) {
                showWarn("Indique el ID a cancelar.");
                return;
            }
            Integer id = Integer.parseInt(txtId.getText().trim());
            String motivo = JOptionPane.showInputDialog(this, "Motivo de cancelación (opcional):");
            if (motivo == null) {
                return;
            }
            ReservaActividad r = service.cancelar(id, motivo);
            cargar(r);
            setModoCreando(false);
            showInfo("Reserva de actividad cancelada. Fecha de baja asignada.");
            if (service.isUltimaAuditoriaFallida()) {
                showWarn("Cancelación aplicada, pero falló la auditoría.");
            }
            refrescarTabla();
        } catch (NumberFormatException ex) {
            showWarn("ID inválido.");
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    private void onReversar() {
        try {
            if (txtId.getText().isBlank()) {
                showWarn("Indique el ID a reversar.");
                return;
            }
            Integer id = Integer.parseInt(txtId.getText().trim());
            String motivo = JOptionPane.showInputDialog(this, "Motivo de reversión (opcional):");
            if (motivo == null) {
                return;
            }
            ReservaActividad r = service.reversar(id, motivo);
            cargar(r);
            setModoCreando(false);
            showInfo("Reserva de actividad reversada.");
            refrescarTabla();
        } catch (NumberFormatException ex) {
            showWarn("ID inválido.");
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    @Override
    protected void onNuevo() {
        onLimpiar();
        txtId.setText(String.valueOf(service.sugerirSiguienteId()));
        seleccionarEstado(EstadoReservaIds.ACTIVA);
        setModoCreando(true);
    }

    @Override
    protected void onGuardar() {
        try {
            ReservaActividad r = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(r.getIdReservaActividad()).isEmpty();
            ReservaActividad guardada = service.guardar(r, creando);
            showInfo(creando ? "Reserva creada." : "Reserva modificada.");
            if (service.isUltimaAuditoriaFallida()) {
                showWarn("Guardado correcto, pero falló la auditoría.");
            }
            cargar(guardada);
            setModoCreando(false);
            refrescarTabla();
        } catch (NumberFormatException ex) {
            showWarn("Campo 'ID': debe ser un entero.");
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
                showWarn("Campo 'ID': es obligatorio para buscar.");
                return;
            }
            Optional<ReservaActividad> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró la reserva.");
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
                showWarn("Indique el ID a eliminar.");
                return;
            }
            Integer id = Integer.parseInt(txtId.getText().trim());
            if (!confirm("¿Eliminar físicamente la reserva " + id + "? Solo canceladas/reversadas.")) {
                return;
            }
            service.eliminar(id);
            showInfo("Reserva eliminada.");
            onLimpiar();
            refrescarTabla();
        } catch (NumberFormatException ex) {
            showWarn("ID inválido.");
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    @Override
    protected void onLimpiar() {
        txtId.setText("");
        prepararNuevoParcial();
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        Integer id = Integer.valueOf(String.valueOf(tableModel.getValueAt(row, 0)));
        service.buscarPorId(id).ifPresent(r -> {
            cargar(r);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        refrescarCombosBase();
        clearTable();
        for (ReservaActividad r : service.listar()) {
            String cli = service.buscarCliente(r.getIdClienteReservaActividad())
                    .map(c -> c.getIdCliente() + " - " + c.getNombreCompleto())
                    .orElse(String.valueOf(r.getIdClienteReservaActividad()));
            String act = service.buscarActividad(r.getIdActividad())
                    .map(a -> a.getIdActividad() + " - " + a.getNombreActividad())
                    .orElse(String.valueOf(r.getIdActividad()));
            String hor = service.buscarHorario(r.getIdHorarioActividad())
                    .map(h -> h.getIdHorarioActividad() + " - " + h.getDiaActividad() + " " + h.getHoraFormateada())
                    .orElse(r.getIdHorarioActividad());
            String est = service.buscarEstado(r.getIdEstadoReservaActividad())
                    .map(e -> e.getIdEstadoReserva() + " - " + e.getDescripcion())
                    .orElse(r.getIdEstadoReservaActividad());
            addTableRow(
                    r.getIdReservaActividad(),
                    DateUtils.format(r.getFechaReserva()),
                    DateUtils.format(r.getFechaBaja()),
                    cli, act, hor, est
            );
        }
    }
}
