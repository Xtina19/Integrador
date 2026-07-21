package ui.component;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

/**
 * Plantilla común para formularios de mantenimiento.
 */
public abstract class MantenimientoBaseFrame extends JDialog {

    protected final FormModeLabel lblModo = new FormModeLabel();
    protected final JButton btnNuevo = new JButton("Nuevo");
    protected final JButton btnGuardar = new JButton("Guardar");
    protected final JButton btnBuscar = new JButton("Buscar");
    protected final JButton btnEliminar = new JButton("Eliminar");
    protected final JButton btnLimpiar = new JButton("Limpiar");
    protected final JButton btnCerrar = new JButton("Cerrar");

    protected final DefaultTableModel tableModel;
    protected final JTable table;

    private boolean modoCreando = true;

    protected MantenimientoBaseFrame(Frame owner, String titulo, String[] columnas) {
        super(owner, titulo, true);
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setSize(820, 560);
        setMinimumSize(new Dimension(720, 480));
        setLocationRelativeTo(owner);

        tableModel = new DefaultTableModel(columnas, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        table = new JTable(tableModel);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setRowHeight(22);
        table.getTableHeader().setReorderingAllowed(false);

        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBackground(UiTheme.BG);
        root.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));

        JPanel top = new JPanel(new BorderLayout(8, 8));
        top.setOpaque(false);
        top.add(buildFormPanel(), BorderLayout.CENTER);

        JPanel modeBar = new JPanel(new FlowLayout(FlowLayout.LEFT));
        modeBar.setOpaque(false);
        modeBar.add(lblModo);
        top.add(modeBar, BorderLayout.NORTH);

        JPanel buttons = buildButtonPanel();
        JScrollPane scroll = new JScrollPane(table);
        scroll.setBorder(BorderFactory.createTitledBorder("Registros"));

        root.add(top, BorderLayout.NORTH);
        root.add(scroll, BorderLayout.CENTER);
        root.add(buttons, BorderLayout.SOUTH);
        setContentPane(root);

        btnNuevo.addActionListener(e -> onNuevo());
        btnGuardar.addActionListener(e -> onGuardar());
        btnBuscar.addActionListener(e -> onBuscar());
        btnEliminar.addActionListener(e -> onEliminar());
        btnLimpiar.addActionListener(e -> onLimpiar());
        btnCerrar.addActionListener(e -> dispose());

        table.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() >= 1 && table.getSelectedRow() >= 0) {
                    onTablaSeleccion(table.getSelectedRow());
                }
            }
        });

        setModoCreando(true);
    }

    private JPanel buildButtonPanel() {
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 4));
        panel.setOpaque(false);
        Dimension size = new Dimension(110, 32);
        for (JButton b : new JButton[]{btnNuevo, btnGuardar, btnBuscar}) {
            styleActionButton(b, size);
            panel.add(b);
        }
        addExtraButtons(panel, size);
        for (JButton b : new JButton[]{btnEliminar, btnLimpiar, btnCerrar}) {
            styleActionButton(b, size);
            panel.add(b);
        }
        return panel;
    }

    protected void styleActionButton(JButton button, Dimension size) {
        button.setFont(UiTheme.BUTTON);
        button.setPreferredSize(size);
        button.setFocusPainted(false);
    }

    /**
     * Hook para botones adicionales (Cancelar/Reversar, etc.).
     */
    protected void addExtraButtons(JPanel panel, Dimension size) {
        // por defecto ninguno
    }

    protected void setModoCreando(boolean creando) {
        this.modoCreando = creando;
        if (creando) {
            lblModo.setCreating();
        } else {
            lblModo.setEditing();
        }
    }

    protected boolean isModoCreando() {
        return modoCreando;
    }

    protected void showInfo(String message) {
        JOptionPane.showMessageDialog(this, message, getTitle(), JOptionPane.INFORMATION_MESSAGE);
    }

    protected void showWarn(String message) {
        JOptionPane.showMessageDialog(this, message, getTitle(), JOptionPane.WARNING_MESSAGE);
    }

    protected void showError(String message) {
        JOptionPane.showMessageDialog(this, message, getTitle(), JOptionPane.ERROR_MESSAGE);
    }

    protected boolean confirm(String message) {
        return JOptionPane.showConfirmDialog(this, message, "Confirmación",
                JOptionPane.YES_NO_OPTION) == JOptionPane.YES_OPTION;
    }

    protected void clearTable() {
        tableModel.setRowCount(0);
    }

    protected void addTableRow(Object... values) {
        tableModel.addRow(values);
    }

    protected abstract JPanel buildFormPanel();

    protected abstract void onNuevo();

    protected abstract void onGuardar();

    protected abstract void onBuscar();

    protected abstract void onEliminar();

    protected abstract void onLimpiar();

    protected abstract void onTablaSeleccion(int row);

    protected abstract void refrescarTabla();

    public static void open(JFrame owner, MantenimientoBaseFrame dialog) {
        dialog.refrescarTabla();
        dialog.setVisible(true);
    }
}
