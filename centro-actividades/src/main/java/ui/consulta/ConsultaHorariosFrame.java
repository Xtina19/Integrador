package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;

import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaHorariosFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtDia = new JTextField(10);
    private final JTextField txtHora = new JTextField(6);
    private final JTextField txtActividad = new JTextField(12);

    public ConsultaHorariosFrame(Frame owner) {
        super(owner, "Consulta de horarios",
                new String[]{"ID", "Día", "Hora", "ID actividad", "Actividad"});
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "ID", txtId);
        ConsultaFilterSupport.addLabeled(row, "Día", txtDia);
        ConsultaFilterSupport.addLabeled(row, "Hora (HH:mm)", txtHora);
        ConsultaFilterSupport.addLabeled(row, "Actividad", txtActividad);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtDia.setText("");
        txtHora.setText("");
        txtActividad.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarHorarios(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtDia),
                ConsultaFilterSupport.text(txtHora),
                ConsultaFilterSupport.text(txtActividad));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaHorariosFrame(owner));
    }
}
