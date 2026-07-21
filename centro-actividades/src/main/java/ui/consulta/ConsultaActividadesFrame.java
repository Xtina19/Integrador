package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;

import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaActividadesFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtNombre = new JTextField(12);
    private final JTextField txtEntrenador = new JTextField(12);
    private final JTextField txtLocalizacion = new JTextField(12);

    public ConsultaActividadesFrame(Frame owner) {
        super(owner, "Consulta de actividades",
                new String[]{"ID", "Nombre", "Descripción", "ID entrenador", "Entrenador",
                        "ID localización", "Localización"});
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "ID", txtId);
        ConsultaFilterSupport.addLabeled(row, "Nombre", txtNombre);
        ConsultaFilterSupport.addLabeled(row, "Entrenador", txtEntrenador);
        ConsultaFilterSupport.addLabeled(row, "Localización", txtLocalizacion);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtNombre.setText("");
        txtEntrenador.setText("");
        txtLocalizacion.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarActividades(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtNombre),
                ConsultaFilterSupport.text(txtEntrenador),
                ConsultaFilterSupport.text(txtLocalizacion));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaActividadesFrame(owner));
    }
}
