package ui.movimiento;

import model.Cliente;
import model.Cobro;
import model.DetalleCuota;
import model.EncabezadoCuota;
import service.ClienteService;
import service.CuotaService;
import ui.component.ComboItem;
import ui.component.FormModeLabel;
import ui.component.UiTheme;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;
import validation.Validators;

import javax.swing.BorderFactory;
import javax.swing.DefaultComboBoxModel;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public class CuotaMovimientoFrame extends JDialog {

    private final CuotaService cuotaService = new CuotaService();
    private final ClienteService clienteService = new ClienteService();

    private final FormModeLabel lblModo = new FormModeLabel();
    private final JTextField txtId = new JTextField(16);
    private final JTextField txtFecha = new JTextField(12);
    private final JComboBox<ComboItem<Integer>> cboCliente = new JComboBox<>();
    private final JTextField txtValor = new JTextField(12);
    private final JTextField txtConcepto = new JTextField(24);
    private final JTextField txtBalance = new JTextField(12);

    private final DefaultTableModel modelPendientes = new DefaultTableModel(
            new String[]{"ID Cobro", "Fecha", "Concepto", "Pendiente"}, 0) {
        @Override
        public boolean isCellEditable(int r, int c) {
            return false;
        }
    };
    private final DefaultTableModel modelDistribucion = new DefaultTableModel(
            new String[]{"Seq", "Concepto", "Valor", "ID Cobro"}, 0) {
        @Override
        public boolean isCellEditable(int r, int c) {
            return false;
        }
    };

    private boolean modoCreando = true;

    public CuotaMovimientoFrame(Frame owner) {
        super(owner, "Movimiento: Cuotas / Pagos", true);
        setSize(900, 640);
        setLocationRelativeTo(owner);

        txtFecha.setEditable(false);
        txtBalance.setEditable(false);
        txtFecha.setText(DateUtils.format(DateUtils.today()));

        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));
        root.setBackground(UiTheme.BG);

        root.add(buildForm(), BorderLayout.NORTH);
        root.add(buildTables(), BorderLayout.CENTER);
        root.add(buildButtons(), BorderLayout.SOUTH);
        setContentPane(root);

        txtId.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                buscarId();
            }
        });
        cboCliente.addActionListener(e -> refrescarPendientes());
        txtValor.addFocusListener(new FocusAdapter() {
            @Override
            public void focusLost(FocusEvent e) {
                simular();
            }
        });

        refrescarClientes();
        setModo(true);
    }

    private JPanel buildForm() {
        JPanel form = new JPanel(new GridBagLayout());
        form.setBackground(UiTheme.PANEL);
        form.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UiTheme.BORDER),
                BorderFactory.createEmptyBorder(10, 12, 10, 12)));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(4, 6, 4, 6);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        form.add(lblModo, gbc);
        gbc.gridwidth = 1;

        add(form, gbc, 1, "ID Cuota:", txtId);
        add(form, gbc, 2, "Fecha:", txtFecha);
        add(form, gbc, 3, "Cliente:", cboCliente);
        add(form, gbc, 4, "Balance cliente:", txtBalance);
        add(form, gbc, 5, "Valor entregado:", txtValor);
        add(form, gbc, 6, "Concepto:", txtConcepto);
        return form;
    }

    private void add(JPanel form, GridBagConstraints gbc, int row, String label, java.awt.Component field) {
        gbc.gridx = 0;
        gbc.gridy = row;
        gbc.weightx = 0;
        form.add(new JLabel(label), gbc);
        gbc.gridx = 1;
        gbc.weightx = 1;
        form.add(field, gbc);
    }

    private JPanel buildTables() {
        JPanel panel = new JPanel(new BorderLayout(8, 8));
        panel.setOpaque(false);
        JTable t1 = new JTable(modelPendientes);
        JTable t2 = new JTable(modelDistribucion);
        t1.setPreferredScrollableViewportSize(new Dimension(400, 140));
        t2.setPreferredScrollableViewportSize(new Dimension(400, 140));
        JPanel left = new JPanel(new BorderLayout());
        left.setBorder(BorderFactory.createTitledBorder("Cobros pendientes"));
        left.add(new JScrollPane(t1));
        JPanel right = new JPanel(new BorderLayout());
        right.setBorder(BorderFactory.createTitledBorder("Distribución del pago"));
        right.add(new JScrollPane(t2));
        panel.add(left, BorderLayout.NORTH);
        panel.add(right, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildButtons() {
        JPanel p = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        p.setOpaque(false);
        JButton btnNuevo = new JButton("Nuevo");
        JButton btnGuardar = new JButton("Guardar");
        JButton btnBuscar = new JButton("Buscar");
        JButton btnSimular = new JButton("Simular");
        JButton btnLimpiar = new JButton("Limpiar");
        JButton btnCerrar = new JButton("Cerrar");
        for (JButton b : new JButton[]{btnNuevo, btnGuardar, btnBuscar, btnSimular, btnLimpiar, btnCerrar}) {
            b.setPreferredSize(new Dimension(100, 32));
            p.add(b);
        }
        btnNuevo.addActionListener(e -> nuevo());
        btnGuardar.addActionListener(e -> guardar());
        btnBuscar.addActionListener(e -> buscarId());
        btnSimular.addActionListener(e -> simular());
        btnLimpiar.addActionListener(e -> limpiar());
        btnCerrar.addActionListener(e -> dispose());
        return p;
    }

    private void refrescarClientes() {
        DefaultComboBoxModel<ComboItem<Integer>> model = new DefaultComboBoxModel<>();
        for (Cliente c : clienteService.listar()) {
            if (c.isSocio()) {
                model.addElement(new ComboItem<>(c.getIdCliente(),
                        c.getIdCliente() + " - " + c.getNombreCompleto()));
            }
        }
        cboCliente.setModel(model);
    }

    private void setModo(boolean creando) {
        modoCreando = creando;
        if (creando) {
            lblModo.setCreating();
        } else {
            lblModo.setEditing();
        }
    }

    private Integer clienteSeleccionado() {
        ComboItem<Integer> item = (ComboItem<Integer>) cboCliente.getSelectedItem();
        return item == null ? null : item.getId();
    }

    private void seleccionarCliente(Integer id) {
        for (int i = 0; i < cboCliente.getItemCount(); i++) {
            if (cboCliente.getItemAt(i).getId().equals(id)) {
                cboCliente.setSelectedIndex(i);
                return;
            }
        }
    }

    private void refrescarPendientes() {
        modelPendientes.setRowCount(0);
        Integer id = clienteSeleccionado();
        if (id == null) {
            txtBalance.setText("");
            return;
        }
        clienteService.buscarPorId(id).ifPresent(c ->
                txtBalance.setText(MoneyUtils.format(c.getBalanceCliente())));
        for (Cobro cobro : cuotaService.listarCobrosPendientes(id)) {
            modelPendientes.addRow(new Object[]{
                    cobro.getIdCobro(),
                    DateUtils.format(cobro.getFechaCobro()),
                    cobro.getConceptoCobro(),
                    MoneyUtils.format(cobro.getValorCobro())
            });
        }
        simular();
    }

    private void simular() {
        modelDistribucion.setRowCount(0);
        Integer id = clienteSeleccionado();
        if (id == null || txtValor.getText().isBlank()) {
            return;
        }
        try {
            BigDecimal valor = Validators.requireNonNegativeMoney("Valor", txtValor.getText());
            String concepto = txtConcepto.getText().isBlank() ? "Pago" : txtConcepto.getText().trim();
            List<DetalleCuota> plan = cuotaService.simularDistribucion(id, valor, concepto);
            for (DetalleCuota d : plan) {
                modelDistribucion.addRow(new Object[]{
                        d.getSecuenciaCuota(),
                        d.getConceptoCuota(),
                        MoneyUtils.format(d.getValorCuota()),
                        d.getIdCobroCuota()
                });
            }
        } catch (ValidationException ignored) {
            // se valida al guardar
        }
    }

    private void buscarId() {
        String id = txtId.getText().trim();
        if (id.isEmpty()) {
            return;
        }
        Optional<EncabezadoCuota> opt = cuotaService.buscarEncabezado(id);
        if (opt.isPresent()) {
            EncabezadoCuota e = opt.get();
            if (e.isAplicada()) {
                JOptionPane.showMessageDialog(this,
                        "Esta cuota ya fue aplicada y solo puede consultarse.",
                        "Cuota", JOptionPane.INFORMATION_MESSAGE);
            }
            txtFecha.setText(DateUtils.format(e.getFechaCuota()));
            seleccionarCliente(e.getIdClienteCuota());
            txtValor.setText(MoneyUtils.toStorage(e.getValorCobro()));
            txtConcepto.setText("Pago registrado");
            setModo(!e.isAplicada());
            refrescarPendientes();
            modelDistribucion.setRowCount(0);
            for (DetalleCuota d : cuotaService.listarDetalles(id)) {
                modelDistribucion.addRow(new Object[]{
                        d.getSecuenciaCuota(),
                        d.getConceptoCuota(),
                        MoneyUtils.format(d.getValorCuota()),
                        d.getIdCobroCuota()
                });
            }
        } else {
            setModo(true);
            txtFecha.setText(DateUtils.format(DateUtils.today()));
        }
    }

    private void nuevo() {
        limpiar();
        txtId.setText(cuotaService.sugerirIdCuota());
        setModo(true);
        txtId.requestFocusInWindow();
    }

    private void guardar() {
        try {
            String id = Validators.requireText("ID Cuota", txtId.getText());
            Integer cliente = clienteSeleccionado();
            BigDecimal valor = Validators.requireNonNegativeMoney("Valor", txtValor.getText());
            String concepto = Validators.requireText("Concepto", txtConcepto.getText());
            EncabezadoCuota e = cuotaService.registrarCuota(id, cliente, valor, concepto);
            JOptionPane.showMessageDialog(this,
                    "Cuota registrada. Status pendiente de aplicación.\n"
                            + "Use Procesos → Actualizar cuota con fecha "
                            + DateUtils.format(e.getFechaCuota()) + ".",
                    "Éxito", JOptionPane.INFORMATION_MESSAGE);
            setModo(false);
            buscarId();
        } catch (ValidationException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Validación", JOptionPane.WARNING_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void limpiar() {
        txtId.setText("");
        txtFecha.setText(DateUtils.format(DateUtils.today()));
        txtValor.setText("");
        txtConcepto.setText("");
        txtBalance.setText("");
        modelPendientes.setRowCount(0);
        modelDistribucion.setRowCount(0);
        if (cboCliente.getItemCount() > 0) {
            cboCliente.setSelectedIndex(0);
        }
        setModo(true);
    }

    public static void open(Frame owner) {
        new CuotaMovimientoFrame(owner).setVisible(true);
    }
}
