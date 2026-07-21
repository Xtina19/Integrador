package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;

import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaLocalizacionesFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtTipo = new JTextField(14);

    public ConsultaLocalizacionesFrame(Frame owner) {
        super(owner, "Consulta de localizaciones", new String[]{"ID", "Tipo"});
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "ID", txtId);
        ConsultaFilterSupport.addLabeled(row, "Tipo", txtTipo);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtTipo.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarLocalizaciones(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtTipo));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaLocalizacionesFrame(owner));
    }
}
