package ui.proceso;

import service.CobroService;
import service.SessionContext;
import service.dto.ProcesoResultado;
import ui.component.UiTheme;
import util.DateUtils;
import validation.ValidationException;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.SpinnerNumberModel;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;

public class GenerarCobroFrame extends JDialog {

    private final CobroService service = new CobroService();
    private final JSpinner spMes = new JSpinner(new SpinnerNumberModel(LocalDate.now().getMonthValue(), 1, 12, 1));
    private final JSpinner spAnio = new JSpinner(new SpinnerNumberModel(LocalDate.now().getYear(), 2000, 2100, 1));
    private final DefaultTableModel model = new DefaultTableModel(
            new String[]{"Detalle", "Cliente/ID", "Valor/Info", "Estado"}, 0) {
        @Override
        public boolean isCellEditable(int r, int c) {
            return false;
        }
    };
    private final JTextArea txtResumen = new JTextArea(4, 40);

    public GenerarCobroFrame(Frame owner) {
        super(owner, "Proceso: Generar cobro", true);
        if (!SessionContext.isAdministrador()) {
            throw new IllegalStateException("Solo administrador");
        }
        setSize(720, 520);
        setLocationRelativeTo(owner);

        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));
        root.setBackground(UiTheme.BG);

        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 6));
        top.setOpaque(false);
        top.add(new JLabel("Mes:"));
        top.add(spMes);
        top.add(new JLabel("Año:"));
        top.add(spAnio);
        JButton btnGenerar = new JButton("Generar");
        JButton btnCarpeta = new JButton("Abrir carpeta PDF");
        JButton btnCerrar = new JButton("Cerrar");
        top.add(btnGenerar);
        top.add(btnCarpeta);
        top.add(btnCerrar);

        txtResumen.setEditable(false);
        txtResumen.setFont(UiTheme.LABEL);
        JTable table = new JTable(model);
        root.add(top, BorderLayout.NORTH);
        root.add(new JScrollPane(table), BorderLayout.CENTER);
        root.add(new JScrollPane(txtResumen), BorderLayout.SOUTH);
        setContentPane(root);

        btnGenerar.addActionListener(e -> generar());
        btnCarpeta.addActionListener(e -> abrirCarpeta());
        btnCerrar.addActionListener(e -> dispose());
    }

    private void generar() {
        int mes = (Integer) spMes.getValue();
        int anio = (Integer) spAnio.getValue();
        if (JOptionPane.showConfirmDialog(this,
                "¿Generar cobros de " + DateUtils.formatPeriodo(mes, anio) + "?",
                "Confirmar", JOptionPane.YES_NO_OPTION) != JOptionPane.YES_OPTION) {
            return;
        }
        try {
            ProcesoResultado r = service.generarCobrosMensuales(mes, anio);
            model.setRowCount(0);
            for (String fila : r.getDetallesTabla()) {
                String[] p = fila.split("\\|", -1);
                model.addRow(new Object[]{
                        p.length > 0 ? p[0] : "",
                        p.length > 1 ? p[1] : "",
                        p.length > 2 ? p[2] : "",
                        p.length > 3 ? p[3] : ""
                });
            }
            txtResumen.setText(r.resumenTexto() + "\n" + String.join("\n", r.getMensajes()));
            JOptionPane.showMessageDialog(this, r.resumenTexto(), "Resultado", JOptionPane.INFORMATION_MESSAGE);
        } catch (ValidationException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Error", JOptionPane.WARNING_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void abrirCarpeta() {
        try {
            int mes = (Integer) spMes.getValue();
            int anio = (Integer) spAnio.getValue();
            Path dir = service.carpetaVolantes(mes, anio);
            Files.createDirectories(dir);
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().open(dir.toFile());
            } else {
                JOptionPane.showMessageDialog(this, dir.toAbsolutePath().toString());
            }
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Carpeta", JOptionPane.WARNING_MESSAGE);
        }
    }

    public static void open(Frame owner) {
        new GenerarCobroFrame(owner).setVisible(true);
    }
}
