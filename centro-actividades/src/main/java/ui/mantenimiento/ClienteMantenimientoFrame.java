package ui.mantenimiento;

import model.Cliente;
import service.ClienteService;
import ui.component.MantenimientoBaseFrame;
import ui.component.UiTheme;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;
import validation.Validators;

import javax.swing.BorderFactory;
import javax.swing.JCheckBox;
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

public class ClienteMantenimientoFrame extends MantenimientoBaseFrame {

    private final ClienteService service = new ClienteService();

    private final JTextField txtId = new JTextField(10);
    private final JTextField txtNombre = new JTextField(16);
    private final JTextField txtApellidoPat = new JTextField(14);
    private final JTextField txtApellidoMat = new JTextField(14);
    private final JTextField txtDireccion = new JTextField(24);
    private final JTextField txtFechaNac = new JTextField(12);
    private final JTextField txtTelefono = new JTextField(12);
    private final JTextField txtCelular = new JTextField(12);
    private final JTextField txtFechaIngreso = new JTextField(12);
    private final JComboBox<String> cboTipo = new JComboBox<>(new String[]{"Socio", "Invitado"});
    private final JCheckBox chkActivo = new JCheckBox("Activo");
    private final JTextField txtCorreo = new JTextField(18);
    private final JTextField txtBalance = new JTextField(10);
    private final JTextField txtValorCuota = new JTextField(10);

    public ClienteMantenimientoFrame(Frame owner) {
        super(owner, "Mantenimiento de Clientes",
                new String[]{"ID", "Nombre completo", "Nacimiento", "Ingreso", "Tipo",
                        "Estado", "Correo", "Balance", "Cuota"});
        setSize(920, 640);

        txtFechaIngreso.setEditable(false);
        txtBalance.setEditable(false);
        txtFechaNac.setToolTipText("Formato dd/MM/yyyy");

        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarAutomatico();
            }
        });
        txtId.addActionListener(e -> buscarAutomatico());
        cboTipo.addActionListener(e -> aplicarComportamientoTipo());

        aplicarComportamientoTipo();
        txtFechaIngreso.setText(DateUtils.format(DateUtils.today()));
        txtBalance.setText(MoneyUtils.format(MoneyUtils.zero()));
    }

    @Override
    protected JPanel buildFormPanel() {
        JPanel form = new JPanel(new GridBagLayout());
        form.setBackground(UiTheme.PANEL);
        form.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UiTheme.BORDER),
                BorderFactory.createEmptyBorder(10, 12, 10, 12)));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(3, 6, 3, 6);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        addField(form, gbc, 0, 0, "ID:", txtId);
        addField(form, gbc, 0, 2, "Nombre:", txtNombre);
        addField(form, gbc, 1, 0, "Apellido paterno:", txtApellidoPat);
        addField(form, gbc, 1, 2, "Apellido materno:", txtApellidoMat);
        addField(form, gbc, 2, 0, "Dirección:", txtDireccion, 3);
        addField(form, gbc, 3, 0, "Fecha nacimiento:", txtFechaNac);
        addField(form, gbc, 3, 2, "Teléfono:", txtTelefono);
        addField(form, gbc, 4, 0, "Celular:", txtCelular);
        addField(form, gbc, 4, 2, "Correo:", txtCorreo);
        addField(form, gbc, 5, 0, "Tipo:", cboTipo);
        gbc.gridx = 2;
        gbc.gridy = 5;
        gbc.gridwidth = 1;
        form.add(new JLabel("Estado:"), gbc);
        gbc.gridx = 3;
        form.add(chkActivo, gbc);
        addField(form, gbc, 6, 0, "Fecha ingreso:", txtFechaIngreso);
        addField(form, gbc, 6, 2, "Balance:", txtBalance);
        addField(form, gbc, 7, 0, "Valor cuota:", txtValorCuota);
        return form;
    }

    private void addField(JPanel form, GridBagConstraints gbc, int row, int col,
                          String label, java.awt.Component field) {
        addField(form, gbc, row, col, label, field, 1);
    }

    private void addField(JPanel form, GridBagConstraints gbc, int row, int col,
                          String label, java.awt.Component field, int span) {
        gbc.gridx = col;
        gbc.gridy = row;
        gbc.gridwidth = 1;
        gbc.weightx = 0;
        form.add(new JLabel(label), gbc);
        gbc.gridx = col + 1;
        gbc.gridwidth = span;
        gbc.weightx = 1;
        form.add(field, gbc);
        gbc.gridwidth = 1;
    }

    private void aplicarComportamientoTipo() {
        boolean socio = cboTipo.getSelectedIndex() == 0;
        if (!socio) {
            chkActivo.setSelected(false);
            chkActivo.setEnabled(false);
            txtValorCuota.setText(MoneyUtils.toStorage(MoneyUtils.zero()));
            txtValorCuota.setEnabled(false);
        } else {
            chkActivo.setEnabled(true);
            txtValorCuota.setEnabled(true);
        }
    }

    private void buscarAutomatico() {
        if (txtId.getText().isBlank()) {
            return;
        }
        try {
            Optional<Cliente> opt = service.buscarPorId(txtId.getText());
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
        txtNombre.setText("");
        txtApellidoPat.setText("");
        txtApellidoMat.setText("");
        txtDireccion.setText("");
        txtFechaNac.setText("");
        txtTelefono.setText("");
        txtCelular.setText("");
        txtCorreo.setText("");
        cboTipo.setSelectedIndex(0);
        chkActivo.setSelected(true);
        txtFechaIngreso.setText(DateUtils.format(DateUtils.today()));
        txtBalance.setText(MoneyUtils.format(MoneyUtils.zero()));
        txtValorCuota.setText("");
        aplicarComportamientoTipo();
    }

    private void cargar(Cliente c) {
        txtId.setText(String.valueOf(c.getIdCliente()));
        txtNombre.setText(c.getNombreCliente());
        txtApellidoPat.setText(c.getApellidoPaternoCliente());
        txtApellidoMat.setText(c.getApellidoMaternoCliente());
        txtDireccion.setText(c.getDireccionCliente());
        txtFechaNac.setText(DateUtils.format(c.getFechaNacimientoCliente()));
        txtTelefono.setText(c.getTelefonoCliente());
        txtCelular.setText(c.getCelularCliente());
        txtFechaIngreso.setText(DateUtils.format(c.getFechaIngreso()));
        cboTipo.setSelectedIndex(c.isSocio() ? 0 : 1);
        chkActivo.setSelected(c.isActivo());
        txtCorreo.setText(c.getCorreoCliente() == null ? "" : c.getCorreoCliente());
        txtBalance.setText(MoneyUtils.format(c.getBalanceCliente()));
        txtValorCuota.setText(MoneyUtils.toStorage(c.getValorCuotaCliente()));
        aplicarComportamientoTipo();
    }

    private Cliente leerFormulario() {
        Cliente c = new Cliente();
        c.setIdCliente(Validators.requireInteger("ID Cliente", txtId.getText()));
        c.setNombreCliente(txtNombre.getText().trim());
        c.setApellidoPaternoCliente(txtApellidoPat.getText().trim());
        c.setApellidoMaternoCliente(txtApellidoMat.getText().trim());
        c.setDireccionCliente(txtDireccion.getText().trim());
        c.setFechaNacimientoCliente(service.parseFechaNacimiento(txtFechaNac.getText()));
        c.setTelefonoCliente(txtTelefono.getText().trim());
        c.setCelularCliente(txtCelular.getText().trim());
        c.setTipoCliente(cboTipo.getSelectedIndex() == 0 ? Cliente.TIPO_SOCIO : Cliente.TIPO_INVITADO);
        c.setStatusCliente(chkActivo.isSelected());
        String correo = txtCorreo.getText().trim();
        c.setCorreoCliente(correo.isEmpty() ? null : correo);
        if (c.isSocio()) {
            c.setValorCuotaCliente(Validators.requireNonNegativeMoney("Valor de cuota", txtValorCuota.getText()));
        } else {
            c.setValorCuotaCliente(MoneyUtils.zero());
            c.setStatusCliente(false);
        }
        // fecha ingreso y balance los resuelve el servicio
        return c;
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
            Cliente c = leerFormulario();
            boolean creando = isModoCreando() || service.buscarPorId(c.getIdCliente()).isEmpty();
            Cliente guardado = service.guardar(c, creando);
            showInfo(creando ? "Cliente creado correctamente." : "Cliente modificado correctamente.");
            cargar(guardado);
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
                showWarn("Campo 'ID Cliente': es obligatorio para buscar.");
                return;
            }
            Optional<Cliente> opt = service.buscarPorId(txtId.getText());
            if (opt.isPresent()) {
                cargar(opt.get());
                setModoCreando(false);
            } else {
                showWarn("No se encontró el cliente con ID: " + txtId.getText().trim());
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
                showWarn("Campo 'ID Cliente': indique el registro a eliminar.");
                return;
            }
            Integer id = Validators.requireInteger("ID Cliente", txtId.getText());
            if (!confirm("¿Eliminar el cliente con ID " + id + "?")) {
                return;
            }
            service.eliminar(id);
            showInfo("Cliente eliminado correctamente.");
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
        prepararNuevoParcial();
        setModoCreando(true);
        table.clearSelection();
    }

    @Override
    protected void onTablaSeleccion(int row) {
        Integer id = Integer.valueOf(String.valueOf(tableModel.getValueAt(row, 0)));
        service.buscarPorId(id).ifPresent(c -> {
            cargar(c);
            setModoCreando(false);
        });
    }

    @Override
    protected void refrescarTabla() {
        clearTable();
        for (Cliente c : service.listar()) {
            addTableRow(
                    c.getIdCliente(),
                    c.getNombreCompleto(),
                    DateUtils.format(c.getFechaNacimientoCliente()),
                    DateUtils.format(c.getFechaIngreso()),
                    c.getTipoDescripcion(),
                    c.getStatusDescripcion(),
                    c.getCorreoCliente() == null ? "" : c.getCorreoCliente(),
                    MoneyUtils.format(c.getBalanceCliente()),
                    MoneyUtils.format(c.getValorCuotaCliente())
            );
        }
    }
}
