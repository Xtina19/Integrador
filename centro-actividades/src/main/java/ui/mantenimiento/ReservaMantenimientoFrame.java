package ui.mantenimiento;

import model.Cliente;
import model.EstadoReserva;
import model.EstadoReservaIds;
import model.HorarioActividad;
import model.Reserva;
import model.Sala;
import service.ActividadService;
import service.ReservaService;
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

public class ReservaMantenimientoFrame extends MantenimientoBaseFrame {

    private final ReservaService service = new ReservaService();
    private final ActividadService actividadService = new ActividadService();

    private final JTextField txtId = new JTextField(14);
    private final JComboBox<ComboItem<Integer>> cboSala = new JComboBox<>();
    private final JComboBox<ComboItem<Integer>> cboCliente = new JComboBox<>();
    private final JTextField txtFecha = new JTextField(12);
    private final JComboBox<ComboItem<String>> cboHorario = new JComboBox<>();
    private final JComboBox<ComboItem<String>> cboEstado = new JComboBox<>();
    private final JLabel lblDiaFecha = new JLabel(" ");

    private final JButton btnCancelar = new JButton("Cancelar");
    private final JButton btnReversar = new JButton("Reversar");

    private boolean cargando = false;

    public ReservaMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Reservas de Salas",
                new String[]{"ID", "Sala", "Cliente", "Fecha", "Horario", "Estado"});
        setSize(900, 600);

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
                onFechaCambiada();
            }
        });
        txtFecha.addActionListener(e -> onFechaCambiada());

        btnCancelar.addActionListener(e -> onCancelar());
        btnReversar.addActionListener(e -> onReversar());
        btnReversar.setEnabled(SessionContext.isAdministrador());
        btnEliminar.setEnabled(SessionContext.isAdministrador());

        refrescarCombosBase();
        filtrarHorarios(null, null);
    }

    @Override
    protected void addExtraButtons(JPanel panel, Dimension size) {
        styleActionButton(btnCancelar, size);
        styleActionButton(btnReversar, new Dimension(110, 32));
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

        addField(form, gbc, 0, "ID Reserva:", txtId);
        addField(form, gbc, 1, "Sala:", cboSala);
        addField(form, gbc, 2, "Cliente:", cboCliente);
        addField(form, gbc, 3, "Fecha (dd/MM/yyyy):", txtFecha);
        gbc.gridx = 1;
        gbc.gridy = 4;
        lblDiaFecha.setForeground(UiTheme.MUTED);
        form.add(lblDiaFecha, gbc);
        addField(form, gbc, 5, "Horario:", cboHorario);
        addField(form, gbc, 6, "Estado:", cboEstado);

        gbc.gridx = 1;
        gbc.gridy = 7;
        JLabel note = new JLabel("Nota: los horarios se filtran por día de la semana (no por sala).");
        note.setForeground(UiTheme.MUTED);
        form.add(note, gbc);
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
        DefaultComboBoxModel<ComboItem<Integer>> salas = new DefaultComboBoxModel<>();
        for (Sala s : service.listarSalas()) {
            salas.addElement(new ComboItem<>(s.getIdSala(), s.getIdSala() + " - " + s.getNombreSala()));
        }
        cboSala.setModel(salas);

        DefaultComboBoxModel<ComboItem<Integer>> clientes = new DefaultComboBoxModel<>();
        for (Cliente c : service.listarClientes()) {
            clientes.addElement(new ComboItem<>(c.getIdCliente(),
                    c.getIdCliente() + " - " + c.getNombreCompleto()));
        }
        cboCliente.setModel(clientes);

        DefaultComboBoxModel<ComboItem<String>> estados = new DefaultComboBoxModel<>();
        for (EstadoReserva e : service.listarEstados()) {
            estados.addElement(new ComboItem<>(e.getIdEstadoReserva(),
                    e.getIdEstadoReserva() + " - " + e.getDescripcion()));
        }
        cboEstado.setModel(estados);
        seleccionarEstado(EstadoReservaIds.ACTIVA);
    }

    private void onFechaCambiada() {
        if (cargando) {
            return;
        }
        LocalDate fecha = DateUtils.parseDate(txtFecha.getText()).orElse(null);
        if (fecha != null) {
            lblDiaFecha.setText("Día: " + DateUtils.diaSemanaEspanol(fecha));
        } else {
            lblDiaFecha.setText(" ");
        }
        String horarioActual = selectedHorarioId();
        filtrarHorarios(fecha, horarioActual);
    }

    private void filtrarHorarios(LocalDate fecha, String preferido) {
        List<HorarioActividad> horarios = fecha == null
                ? service.listarHorarios()
                : service.listarHorariosPorFecha(fecha);

        DefaultComboBoxModel<ComboItem<String>> model = new DefaultComboBoxModel<>();
        for (HorarioActividad h : horarios) {
            String nombreAct = actividadService.buscarPorId(h.getIdActividad())
                    .map(a -> a.getNombreActividad())
                    .orElse(String.valueOf(h.getIdActividad()));
            model.addElement(new ComboItem<>(h.getIdHorarioActividad(),
                    h.getIdHorarioActividad() + " - " + nombreAct + " - "
                            + h.getDiaActividad() + " - " + h.getHoraFormateada()));
        }
        cboHorario.setModel(model);
        if (preferido != null) {
            seleccionarHorario(preferido);
        }
    }

    private void buscarAutomatico() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            return;
        }
        Optional<Reserva> opt = service.buscarPorId(id);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            prepararNuevoParcial();
            setModoCreando(true);
        }
    }

    private void prepararNuevoParcial() {
        if (cboSala.getItemCount() > 0) {
            cboSala.setSelectedIndex(0);
        }
        if (cboCliente.getItemCount() > 0) {
            cboCliente.setSelectedIndex(0);
        }
        txtFecha.setText("");
        lblDiaFecha.setText(" ");
        seleccionarEstado(EstadoReservaIds.ACTIVA);
        filtrarHorarios(null, null);
    }

    private void cargar(Reserva r) {
        cargando = true;
        try {
            txtId.setText(r.getIdReserva());
            seleccionarInt(cboSala, r.getIdSalaReserva());
            seleccionarInt(cboCliente, r.getIdClienteReserva());
            txtFecha.setText(DateUtils.format(r.getFechaReserva()));
            lblDiaFecha.setText("Día: " + DateUtils.diaSemanaEspanol(r.getFechaReserva()));
            filtrarHorarios(r.getFechaReserva(), r.getIdHorarioReserva());
            seleccionarEstado(r.getIdEstadoReserva());
        } finally {
            cargando = false;
        }
    }

    private Reserva leerFormulario() {
        Reserva r = new Reserva();
        r.setIdReserva(txtId.getText().trim());
        ComboItem<Integer> sala = (ComboItem<Integer>) cboSala.getSelectedItem();
        ComboItem<Integer> cli = (ComboItem<Integer>) cboCliente.getSelectedItem();
        ComboItem<String> hor = (ComboItem<String>) cboHorario.getSelectedItem();
        ComboItem<String> est = (ComboItem<String>) cboEstado.getSelectedItem();
        if (sala == null) {
            throw new ValidationException("Sala", "seleccione una sala.");
        }
        if (cli == null) {
            throw new ValidationException("Cliente", "seleccione un cliente.");
        }
        if (hor == null) {
            throw new ValidationException("Horario", "seleccione un horario.");
        }
        if (est == null) {
            throw new ValidationException("Estado", "seleccione un estado.");
        }
        r.setIdSalaReserva(sala.getId());
        r.setIdClienteReserva(cli.getId());
        r.setFechaReserva(DateUtils.parseDate(txtFecha.getText()).orElseThrow(() ->
                new ValidationException("Fecha", "debe tener formato dd/MM/yyyy.")));
        r.setIdHorarioReserva(hor.getId());
        r.setIdEstadoReserva(est.getId());
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

    private void seleccionarHorario(String id) {
        for (int i = 0; i < cboHorario.getItemCount(); i++) {
            if (cboHorario.getItemAt(i).getId().equalsIgnoreCase(id)) {
                cboHorario.setSelectedIndex(i);
                return;
            }
        }
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
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            showWarn("Indique el ID de la reserva a cancelar.");
            return;
        }
        String motivo = JOptionPane.showInputDialog(this, "Motivo de cancelación (opcional):");
        if (motivo == null) {
            return;
        }
        try {
            Reserva r = service.cancelar(id, motivo);
            cargar(r);
            setModoCreando(false);
            showInfo("Reserva cancelada.");
            if (service.isUltimaAuditoriaFallida()) {
                showWarn("La cancelación se aplicó, pero falló el registro de auditoría.");
            }
            refrescarTabla();
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    private void onReversar() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            showWarn("Indique el ID de la reserva a reversar.");
            return;
        }
        String motivo = JOptionPane.showInputDialog(this, "Motivo de reversión (opcional):");
        if (motivo == null) {
            return;
        }
        try {
            Reserva r = service.reversar(id, motivo);
            cargar(r);
            setModoCreando(false);
            showInfo("Reserva reversada.");
            refrescarTabla();
        } catch (ValidationException ex) {
            showWarn(ex.getMessage());
        }
    }

    @Override
    protected void onNuevo() {
        onLimpiar();
        setModoCreando(true);
        seleccionarEstado(EstadoReservaIds.ACTIVA);
        txtId.requestFocusInWindow();
    }

    @Override
    protected void onGuardar() {
        try {
            Reserva r = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(r.getIdReserva()).isEmpty();
            Reserva guardada = service.guardar(r, creando);
            showInfo(creando ? "Reserva creada." : "Reserva modificada.");
            if (service.isUltimaAuditoriaFallida()) {
                showWarn("La operación se guardó, pero falló el registro de auditoría.");
            }
            cargar(guardada);
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
            showWarn("Campo 'ID Reserva': es obligatorio para buscar.");
            return;
        }
        Optional<Reserva> opt = service.buscarPorId(id);
        if (opt.isPresent()) {
            cargar(opt.get());
            setModoCreando(false);
        } else {
            showWarn("No se encontró la reserva: " + id);
            setModoCreando(true);
        }
    }

    @Override
    protected void onEliminar() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            showWarn("Indique el ID a eliminar.");
            return;
        }
        if (!confirm("¿Eliminar físicamente la reserva \"" + id + "\"? Solo si está cancelada/reversada.")) {
            return;
        }
        try {
            service.eliminar(id);
            showInfo("Reserva eliminada.");
            onLimpiar();
            refrescarTabla();
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
        String id = String.valueOf(tableModel.getValueAt(row, 0));
        service.buscarPorId(id).ifPresent(r -> {
            cargar(r);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        refrescarCombosBase();
        clearTable();
        for (Reserva r : service.listar()) {
            String sala = service.buscarSala(r.getIdSalaReserva())
                    .map(s -> s.getIdSala() + " - " + s.getNombreSala())
                    .orElse(String.valueOf(r.getIdSalaReserva()));
            String cli = service.buscarCliente(r.getIdClienteReserva())
                    .map(c -> c.getIdCliente() + " - " + c.getNombreCompleto())
                    .orElse(String.valueOf(r.getIdClienteReserva()));
            String hor = service.buscarHorario(r.getIdHorarioReserva())
                    .map(h -> h.getIdHorarioActividad() + " - " + h.getDiaActividad() + " " + h.getHoraFormateada())
                    .orElse(r.getIdHorarioReserva());
            String est = service.buscarEstado(r.getIdEstadoReserva())
                    .map(e -> e.getIdEstadoReserva() + " - " + e.getDescripcion())
                    .orElse(r.getIdEstadoReserva());
            addTableRow(r.getIdReserva(), sala, cli, DateUtils.format(r.getFechaReserva()), hor, est);
        }
    }
}
