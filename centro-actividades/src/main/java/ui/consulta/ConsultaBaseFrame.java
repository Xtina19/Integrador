package ui.consulta;

import service.dto.ConsultaResultado;
import ui.component.MoneyCellRenderer;
import ui.component.UiTheme;
import util.CsvUtils;
import validation.ValidationException;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Base reutilizable para ventanas de consulta (solo lectura).
 */
public abstract class ConsultaBaseFrame extends JDialog {

    protected final DefaultTableModel tableModel;
    protected final JTable table;
    protected final JLabel lblCantidad = new JLabel("Registros: 0");
    protected final JTextArea txtResumen = new JTextArea(3, 40);
    protected final JButton btnBuscar = new JButton("Buscar");
    protected final JButton btnLimpiar = new JButton("Limpiar");
    protected final JButton btnExportar = new JButton("Exportar CSV");
    protected final JButton btnCerrar = new JButton("Cerrar");
    /** Contenedor opcional bajo la tabla principal (p. ej. detalles de cuota). */
    protected final JPanel extraCenter = new JPanel(new BorderLayout());
    private final JPanel filtersHost = new JPanel(new BorderLayout());
    private boolean filtersInstalled;

    protected ConsultaBaseFrame(Frame owner, String titulo, String[] columnas) {
        super(owner, titulo, true);
        setSize(920, 600);
        setMinimumSize(new Dimension(760, 480));
        setLocationRelativeTo(owner);

        tableModel = new DefaultTableModel(columnas, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }

            @Override
            public Class<?> getColumnClass(int columnIndex) {
                if (getRowCount() == 0) {
                    return Object.class;
                }
                Object v = getValueAt(0, columnIndex);
                return v == null ? Object.class : v.getClass();
            }
        };
        table = new JTable(tableModel);
        table.setAutoCreateRowSorter(true);
        table.setRowHeight(22);
        MoneyCellRenderer renderer = new MoneyCellRenderer();
        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(renderer);
        }

        txtResumen.setEditable(false);
        txtResumen.setLineWrap(true);
        txtResumen.setWrapStyleWord(true);
        txtResumen.setFont(UiTheme.LABEL);
        extraCenter.setOpaque(false);
        filtersHost.setOpaque(false);

        JPanel root = new JPanel(new BorderLayout(8, 8));
        root.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        root.setBackground(UiTheme.BG);

        JPanel center = new JPanel(new BorderLayout(6, 6));
        center.setOpaque(false);
        center.add(new JScrollPane(table), BorderLayout.CENTER);
        center.add(extraCenter, BorderLayout.SOUTH);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setOpaque(false);
        JPanel info = new JPanel(new FlowLayout(FlowLayout.LEFT));
        info.setOpaque(false);
        info.add(lblCantidad);
        bottom.add(info, BorderLayout.NORTH);
        bottom.add(new JScrollPane(txtResumen), BorderLayout.CENTER);
        bottom.add(buildButtons(), BorderLayout.SOUTH);

        root.add(filtersHost, BorderLayout.NORTH);
        root.add(center, BorderLayout.CENTER);
        root.add(bottom, BorderLayout.SOUTH);
        setContentPane(root);

        btnBuscar.addActionListener(e -> ejecutarBusqueda());
        btnLimpiar.addActionListener(e -> {
            limpiarFiltros();
            ejecutarBusqueda();
        });
        btnExportar.addActionListener(e -> exportarCsv());
        btnCerrar.addActionListener(e -> dispose());
    }

    /**
     * Instala el panel de filtros tras el constructor de la subclase
     * (los campos de filtro aún no existen durante {@code super(...)}).
     */
    protected void installFilters() {
        if (filtersInstalled) {
            return;
        }
        JPanel filters = buildFilterPanel();
        filters.setBorder(BorderFactory.createTitledBorder("Filtros"));
        filtersHost.add(filters, BorderLayout.CENTER);
        filtersInstalled = true;
    }

    private JPanel buildButtons() {
        JPanel p = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 4));
        p.setOpaque(false);
        Dimension size = new Dimension(120, 32);
        for (JButton b : new JButton[]{btnBuscar, btnLimpiar, btnExportar, btnCerrar}) {
            b.setPreferredSize(size);
            b.setFont(UiTheme.BUTTON);
            p.add(b);
        }
        return p;
    }

    protected void mostrar(ConsultaResultado resultado) {
        tableModel.setRowCount(0);
        if (resultado == null || resultado.getFilas().isEmpty()) {
            lblCantidad.setText("Registros: 0 — Sin resultados");
            txtResumen.setText(resultado == null ? "" : resultado.getResumen());
            return;
        }
        for (Object[] row : resultado.getFilas()) {
            Object[] display = new Object[row.length];
            for (int i = 0; i < row.length; i++) {
                Object v = row[i];
                if (v instanceof LocalDate || v instanceof LocalTime || v instanceof BigDecimal) {
                    display[i] = v;
                } else {
                    display[i] = v;
                }
            }
            tableModel.addRow(display);
        }
        lblCantidad.setText("Registros: " + resultado.getCantidad());
        txtResumen.setText(resultado.getResumen());
    }

    protected void ejecutarBusqueda() {
        try {
            mostrar(buscar());
        } catch (ValidationException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), getTitle(), JOptionPane.WARNING_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), getTitle(), JOptionPane.ERROR_MESSAGE);
        }
    }

    protected void exportarCsv() {
        if (tableModel.getRowCount() == 0) {
            int op = JOptionPane.showConfirmDialog(this,
                    "No hay filas visibles. ¿Exportar solo encabezados?",
                    "Exportar", JOptionPane.YES_NO_OPTION);
            if (op != JOptionPane.YES_OPTION) {
                return;
            }
        }
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Exportar CSV");
        chooser.setFileFilter(new FileNameExtensionFilter("CSV (*.csv)", "csv"));
        chooser.setSelectedFile(new File(sugerirNombreArchivo()));
        if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) {
            return;
        }
        Path path = CsvUtils.ensureCsvExtension(chooser.getSelectedFile().toPath());
        try {
            if (Files.exists(path)) {
                int op = JOptionPane.showConfirmDialog(this,
                        "El archivo ya existe. ¿Sobrescribir?\n" + path.toAbsolutePath(),
                        "Confirmar", JOptionPane.YES_NO_OPTION);
                if (op != JOptionPane.YES_OPTION) {
                    return;
                }
            }
            String[] headers = new String[tableModel.getColumnCount()];
            for (int i = 0; i < headers.length; i++) {
                headers[i] = tableModel.getColumnName(i);
            }
            List<Object[]> rows = new ArrayList<>();
            for (int viewRow = 0; viewRow < table.getRowCount(); viewRow++) {
                int modelRow = table.convertRowIndexToModel(viewRow);
                Object[] row = new Object[tableModel.getColumnCount()];
                for (int c = 0; c < row.length; c++) {
                    row[c] = tableModel.getValueAt(modelRow, c);
                }
                rows.add(row);
            }
            CsvUtils.writeCsv(path, headers, rows);
            JOptionPane.showMessageDialog(this,
                    "CSV exportado correctamente:\n" + path.toAbsolutePath(),
                    "Exportar", JOptionPane.INFORMATION_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error al exportar: " + ex.getMessage(),
                    "Exportar", JOptionPane.ERROR_MESSAGE);
        }
    }

    protected String sugerirNombreArchivo() {
        return getTitle().replaceAll("[^A-Za-z0-9_-]+", "_") + ".csv";
    }

    protected abstract JPanel buildFilterPanel();

    protected abstract void limpiarFiltros();

    protected abstract ConsultaResultado buscar();

    public static void open(ConsultaBaseFrame frame) {
        frame.installFilters();
        frame.ejecutarBusqueda();
        frame.setVisible(true);
    }
}
