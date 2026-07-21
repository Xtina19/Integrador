package ui.consulta;

import model.Cliente;
import service.ConsultaService;
import service.dto.ConsultaResultado;
import ui.component.ComboItem;

import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.Frame;
import java.awt.GridLayout;

public class ConsultaClientesFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtNombre = new JTextField(10);
    private final JTextField txtApellido = new JTextField(10);
    private final JComboBox<ComboItem<Integer>> cboTipo = ConsultaFilterSupport.comboTipoCliente();
    private final JComboBox<ComboItem<Boolean>> cboEstado = ConsultaFilterSupport.comboActivo();
    private final JTextField txtCorreo = new JTextField(14);
    private final JTextField txtIngresoDesde = new JTextField(10);
    private final JTextField txtIngresoHasta = new JTextField(10);

    public ConsultaClientesFrame(Frame owner) {
        super(owner, "Consulta de clientes",
                new String[]{"ID", "Nombre completo", "Dirección", "Fecha nacimiento", "Fecha ingreso",
                        "Teléfono", "Celular", "Correo", "Tipo", "Estado", "Balance", "Valor cuota"});
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new GridLayout(2, 1));
        wrap.setOpaque(false);
        JPanel r1 = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(r1, "ID", txtId);
        ConsultaFilterSupport.addLabeled(r1, "Nombre", txtNombre);
        ConsultaFilterSupport.addLabeled(r1, "Apellido", txtApellido);
        ConsultaFilterSupport.addLabeled(r1, "Tipo", cboTipo);
        ConsultaFilterSupport.addLabeled(r1, "Estado", cboEstado);
        JPanel r2 = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(r2, "Correo", txtCorreo);
        ConsultaFilterSupport.addLabeled(r2, "Ingreso desde", txtIngresoDesde);
        ConsultaFilterSupport.addLabeled(r2, "Ingreso hasta", txtIngresoHasta);
        wrap.add(r1);
        wrap.add(r2);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtNombre.setText("");
        txtApellido.setText("");
        cboTipo.setSelectedIndex(0);
        cboEstado.setSelectedIndex(0);
        txtCorreo.setText("");
        txtIngresoDesde.setText("");
        txtIngresoHasta.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        Integer tipo = ConsultaFilterSupport.selectedId(cboTipo);
        if (tipo != null && tipo != Cliente.TIPO_SOCIO && tipo != Cliente.TIPO_INVITADO) {
            tipo = null;
        }
        return service.consultarClientes(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtNombre),
                ConsultaFilterSupport.text(txtApellido),
                tipo,
                ConsultaFilterSupport.selectedId(cboEstado),
                ConsultaFilterSupport.text(txtCorreo),
                ConsultaFilterSupport.parseDateOptional(txtIngresoDesde, "Fecha ingreso desde"),
                ConsultaFilterSupport.parseDateOptional(txtIngresoHasta, "Fecha ingreso hasta"));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaClientesFrame(owner));
    }
}
