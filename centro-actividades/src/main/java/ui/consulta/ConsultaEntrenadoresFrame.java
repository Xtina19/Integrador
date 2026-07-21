package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;

import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaEntrenadoresFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtNombre = new JTextField(10);
    private final JTextField txtApellido = new JTextField(10);
    private final JTextField txtTelefono = new JTextField(10);
    private final JTextField txtCorreo = new JTextField(14);

    public ConsultaEntrenadoresFrame(Frame owner) {
        super(owner, "Consulta de entrenadores",
                new String[]{"ID", "Nombre", "Apellido", "Nombre completo", "Teléfono", "Correo"});
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "ID", txtId);
        ConsultaFilterSupport.addLabeled(row, "Nombre", txtNombre);
        ConsultaFilterSupport.addLabeled(row, "Apellido", txtApellido);
        ConsultaFilterSupport.addLabeled(row, "Teléfono", txtTelefono);
        ConsultaFilterSupport.addLabeled(row, "Correo", txtCorreo);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtNombre.setText("");
        txtApellido.setText("");
        txtTelefono.setText("");
        txtCorreo.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarEntrenadores(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtNombre),
                ConsultaFilterSupport.text(txtApellido),
                ConsultaFilterSupport.text(txtTelefono),
                ConsultaFilterSupport.text(txtCorreo));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaEntrenadoresFrame(owner));
    }
}
