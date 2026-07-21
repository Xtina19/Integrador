package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;

import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaSalasFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtNombre = new JTextField(12);
    private final JTextField txtLocalizacion = new JTextField(12);

    public ConsultaSalasFrame(Frame owner) {
        super(owner, "Consulta de salas",
                new String[]{"ID", "Nombre", "Descripción", "ID localización", "Localización"});
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "ID", txtId);
        ConsultaFilterSupport.addLabeled(row, "Nombre", txtNombre);
        ConsultaFilterSupport.addLabeled(row, "Localización", txtLocalizacion);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtNombre.setText("");
        txtLocalizacion.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarSalas(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtNombre),
                ConsultaFilterSupport.text(txtLocalizacion));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaSalasFrame(owner));
    }
}
