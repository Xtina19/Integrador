package ui.consulta;

import service.ConsultaService;
import service.SessionContext;
import service.dto.ConsultaResultado;
import ui.component.ComboItem;
import validation.ValidationException;

import javax.swing.JComboBox;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaUsuariosFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtLogin = new JTextField(10);
    private final JTextField txtNombre = new JTextField(10);
    private final JTextField txtApellido = new JTextField(10);
    private final JTextField txtCorreo = new JTextField(14);
    private final JComboBox<ComboItem<Integer>> cboNivel = ConsultaFilterSupport.comboNivel();

    public ConsultaUsuariosFrame(Frame owner) {
        super(owner, "Consulta de usuarios",
                new String[]{"Login", "Nombre", "Apellidos", "Correo", "Nivel", "Descripción nivel"});
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException("Acceso denegado. Solo el administrador puede consultar usuarios.");
        }
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "Login", txtLogin);
        ConsultaFilterSupport.addLabeled(row, "Nombre", txtNombre);
        ConsultaFilterSupport.addLabeled(row, "Apellido", txtApellido);
        ConsultaFilterSupport.addLabeled(row, "Nivel", cboNivel);
        ConsultaFilterSupport.addLabeled(row, "Correo", txtCorreo);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtLogin.setText("");
        txtNombre.setText("");
        txtApellido.setText("");
        txtCorreo.setText("");
        cboNivel.setSelectedIndex(0);
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarUsuarios(
                ConsultaFilterSupport.text(txtLogin),
                ConsultaFilterSupport.text(txtNombre),
                ConsultaFilterSupport.text(txtApellido),
                ConsultaFilterSupport.selectedId(cboNivel),
                ConsultaFilterSupport.text(txtCorreo));
    }

    public static void open(Frame owner) {
        try {
            ConsultaBaseFrame.open(new ConsultaUsuariosFrame(owner));
        } catch (ValidationException ex) {
            JOptionPane.showMessageDialog(owner, ex.getMessage(), "Consulta de usuarios",
                    JOptionPane.WARNING_MESSAGE);
        }
    }
}
