package ui.proceso;

import service.CuotaService;
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
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.table.DefaultTableModel;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.time.LocalDate;

public class ActualizarCuotaFrame extends JDialog {

    private final CuotaService service = new CuotaService();
    private final JTextField txtFecha = new JTextField(12);
    private final DefaultTableModel model = new DefaultTableModel(
            new String[]{"ID Cuota", "Cliente", "Monto", "Estado"}, 0) {
        @Override
        public boolean isCellEditable(int r, int c) {
            return false;
        }
    };
    private final JTextArea txtResumen = new JTextArea(5, 40);

    public ActualizarCuotaFrame(Frame owner) {
        super(owner, "Proceso: Actualizar cuota", true);
        setSize(720, 500);
        setLocationRelativeTo(owner);
        txtFecha.setText(DateUtils.format(LocalDate.now()));

        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));
        root.setBackground(UiTheme.BG);

        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 6));
        top.setOpaque(false);
        top.add(new JLabel("Fecha (dd/MM/yyyy):"));
        top.add(txtFecha);
        JButton btnProcesar = new JButton("Actualizar");
        JButton btnCerrar = new JButton("Cerrar");
        top.add(btnProcesar);
        top.add(btnCerrar);

        txtResumen.setEditable(false);
        root.add(top, BorderLayout.NORTH);
        root.add(new JScrollPane(new JTable(model)), BorderLayout.CENTER);
        root.add(new JScrollPane(txtResumen), BorderLayout.SOUTH);
        setContentPane(root);

        btnProcesar.addActionListener(e -> procesar());
        btnCerrar.addActionListener(e -> dispose());
    }

    private void procesar() {
        try {
            LocalDate fecha = DateUtils.parseDate(txtFecha.getText())
                    .orElseThrow(() -> new ValidationException("Fecha", "formato dd/MM/yyyy."));
            if (JOptionPane.showConfirmDialog(this,
                    "¿Aplicar cuotas pendientes del " + DateUtils.format(fecha) + "?",
                    "Confirmar", JOptionPane.YES_NO_OPTION) != JOptionPane.YES_OPTION) {
                return;
            }
            ProcesoResultado r = service.actualizarCuotasPorFecha(fecha);
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

    public static void open(Frame owner) {
        new ActualizarCuotaFrame(owner).setVisible(true);
    }
}
