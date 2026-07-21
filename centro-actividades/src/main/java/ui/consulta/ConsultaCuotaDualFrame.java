package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;
import ui.component.MoneyCellRenderer;
import util.CsvUtils;
import util.FileUtils;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Frame;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Base para consultas de cuotas con tabla de encabezados + detalles.
 */
abstract class ConsultaCuotaDualFrame extends ConsultaBaseFrame {

    protected final ConsultaService service = new ConsultaService();
    protected final DefaultTableModel detalleModel;
    protected final JTable detalleTable;
    protected final JLabel lblDetalle = new JLabel("Detalles: seleccione una cuota");

    protected ConsultaCuotaDualFrame(Frame owner, String titulo, String[] columnasEncabezado) {
        super(owner, titulo, columnasEncabezado);
        setSize(960, 700);

        detalleModel = new DefaultTableModel(
                new String[]{"Secuencia", "ID cobro", "Concepto", "Valor aplicado"}, 0) {
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
        detalleTable = new JTable(detalleModel);
        detalleTable.setAutoCreateRowSorter(true);
        detalleTable.setRowHeight(22);
        MoneyCellRenderer renderer = new MoneyCellRenderer();
        for (int i = 0; i < detalleTable.getColumnCount(); i++) {
            detalleTable.getColumnModel().getColumn(i).setCellRenderer(renderer);
        }

        JButton btnExportarDetalles = new JButton("Exportar detalles CSV");
        JButton btnExportarCombinado = new JButton("Exportar combinado CSV");
        btnExportarDetalles.addActionListener(e -> exportarTabla(detalleTable, detalleModel, "detalles"));
        btnExportarCombinado.addActionListener(e -> exportarCombinado());

        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createTitledBorder("Detalles de la cuota seleccionada"));
        panel.setPreferredSize(new Dimension(0, 180));
        panel.add(lblDetalle, BorderLayout.NORTH);
        panel.add(new JScrollPane(detalleTable), BorderLayout.CENTER);
        JPanel btns = ConsultaFilterSupport.row();
        btns.add(btnExportarDetalles);
        btns.add(btnExportarCombinado);
        panel.add(btns, BorderLayout.SOUTH);
        extraCenter.add(panel, BorderLayout.CENTER);

        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.getSelectionModel().addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting()) {
                cargarDetalleSeleccionado();
            }
        });
    }

    @Override
    protected void mostrar(ConsultaResultado resultado) {
        super.mostrar(resultado);
        detalleModel.setRowCount(0);
        lblDetalle.setText("Detalles: seleccione una cuota");
    }

    private void cargarDetalleSeleccionado() {
        int view = table.getSelectedRow();
        if (view < 0) {
            detalleModel.setRowCount(0);
            lblDetalle.setText("Detalles: seleccione una cuota");
            return;
        }
        int model = table.convertRowIndexToModel(view);
        Object id = tableModel.getValueAt(model, 0);
        try {
            ConsultaResultado det = service.consultarDetallesCuota(id == null ? null : String.valueOf(id));
            detalleModel.setRowCount(0);
            for (Object[] row : det.getFilas()) {
                detalleModel.addRow(row);
            }
            lblDetalle.setText(det.getResumen());
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), getTitle(), JOptionPane.ERROR_MESSAGE);
        }
    }

    private void exportarTabla(JTable t, DefaultTableModel model, String sufijo) {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Exportar CSV");
        chooser.setFileFilter(new FileNameExtensionFilter("CSV (*.csv)", "csv"));
        chooser.setSelectedFile(new File(sugerirNombreArchivo().replace(".csv", "_" + sufijo + ".csv")));
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
            String[] headers = new String[model.getColumnCount()];
            for (int i = 0; i < headers.length; i++) {
                headers[i] = model.getColumnName(i);
            }
            List<Object[]> rows = new ArrayList<>();
            for (int viewRow = 0; viewRow < t.getRowCount(); viewRow++) {
                int modelRow = t.convertRowIndexToModel(viewRow);
                Object[] row = new Object[model.getColumnCount()];
                for (int c = 0; c < row.length; c++) {
                    row[c] = model.getValueAt(modelRow, c);
                }
                rows.add(row);
            }
            CsvUtils.writeCsv(path, headers, rows);
            JOptionPane.showMessageDialog(this,
                    "CSV exportado:\n" + path.toAbsolutePath(),
                    "Exportar", JOptionPane.INFORMATION_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage(),
                    "Exportar", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void exportarCombinado() {
        if (tableModel.getRowCount() == 0) {
            JOptionPane.showMessageDialog(this, "No hay encabezados para exportar.");
            return;
        }
        JFileChooser chooser = new JFileChooser();
        chooser.setFileFilter(new FileNameExtensionFilter("CSV (*.csv)", "csv"));
        chooser.setSelectedFile(new File(sugerirNombreArchivo().replace(".csv", "_combinado.csv")));
        if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) {
            return;
        }
        Path path = CsvUtils.ensureCsvExtension(chooser.getSelectedFile().toPath());
        try {
            if (Files.exists(path)) {
                int op = JOptionPane.showConfirmDialog(this,
                        "El archivo ya existe. ¿Sobrescribir?", "Confirmar", JOptionPane.YES_NO_OPTION);
                if (op != JOptionPane.YES_OPTION) {
                    return;
                }
            }
            List<String> lines = new ArrayList<>();
            lines.add(CsvUtils.toCsvLine("SECCION", "ENCABEZADOS"));
            String[] hEnc = new String[tableModel.getColumnCount()];
            for (int i = 0; i < hEnc.length; i++) {
                hEnc[i] = tableModel.getColumnName(i);
            }
            lines.add(CsvUtils.toCsvLine((Object[]) hEnc));
            for (int viewRow = 0; viewRow < table.getRowCount(); viewRow++) {
                int modelRow = table.convertRowIndexToModel(viewRow);
                Object[] row = new Object[tableModel.getColumnCount()];
                for (int c = 0; c < row.length; c++) {
                    row[c] = tableModel.getValueAt(modelRow, c);
                }
                lines.add(CsvUtils.toCsvLine(row));
            }
            lines.add(CsvUtils.toCsvLine("SECCION", "DETALLES_CUOTA_SELECCIONADA"));
            String[] hDet = new String[detalleModel.getColumnCount()];
            for (int i = 0; i < hDet.length; i++) {
                hDet[i] = detalleModel.getColumnName(i);
            }
            lines.add(CsvUtils.toCsvLine((Object[]) hDet));
            for (int viewRow = 0; viewRow < detalleTable.getRowCount(); viewRow++) {
                int modelRow = detalleTable.convertRowIndexToModel(viewRow);
                Object[] row = new Object[detalleModel.getColumnCount()];
                for (int c = 0; c < row.length; c++) {
                    row[c] = detalleModel.getValueAt(modelRow, c);
                }
                lines.add(CsvUtils.toCsvLine(row));
            }
            FileUtils.ensureDirectory(path.getParent());
            Files.write(path, lines, StandardCharsets.UTF_8);
            JOptionPane.showMessageDialog(this,
                    "CSV combinado exportado:\n" + path.toAbsolutePath()
                            + "\n(Secciones ENCABEZADOS y DETALLES_CUOTA_SELECCIONADA)",
                    "Exportar", JOptionPane.INFORMATION_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Error: " + ex.getMessage(),
                    "Exportar", JOptionPane.ERROR_MESSAGE);
        }
    }
}
