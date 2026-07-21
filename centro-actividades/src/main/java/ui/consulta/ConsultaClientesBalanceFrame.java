package ui.consulta;

import model.Cliente;
import service.ConsultaService;
import service.dto.ConsultaResultado;
import ui.component.ComboItem;

import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaClientesBalanceFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtId = new JTextField(6);
    private final JTextField txtNombre = new JTextField(12);
    private final JTextField txtBalanceMin = new JTextField(8);
    private final JCheckBox chkSoloActivos = new JCheckBox("Solo activos", true);
    private final JComboBox<ComboItem<Integer>> cboTipo = ConsultaFilterSupport.comboTipoCliente();

    public ConsultaClientesBalanceFrame(Frame owner) {
        super(owner, "Clientes con balance pendiente",
                new String[]{"ID", "Nombre completo", "Tipo", "Estado", "Balance",
                        "Valor cuota", "Cobros pendientes"});
        chkSoloActivos.setOpaque(false);
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "ID", txtId);
        ConsultaFilterSupport.addLabeled(row, "Nombre", txtNombre);
        ConsultaFilterSupport.addLabeled(row, "Balance mínimo", txtBalanceMin);
        row.add(chkSoloActivos);
        ConsultaFilterSupport.addLabeled(row, "Tipo", cboTipo);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtId.setText("");
        txtNombre.setText("");
        txtBalanceMin.setText("");
        chkSoloActivos.setSelected(true);
        cboTipo.setSelectedIndex(0);
    }

    @Override
    protected ConsultaResultado buscar() {
        Integer tipo = ConsultaFilterSupport.selectedId(cboTipo);
        if (tipo != null && tipo != Cliente.TIPO_SOCIO && tipo != Cliente.TIPO_INVITADO) {
            tipo = null;
        }
        return service.consultarClientesConBalance(
                ConsultaFilterSupport.text(txtId),
                ConsultaFilterSupport.text(txtNombre),
                ConsultaFilterSupport.parseMoneyOptional(txtBalanceMin, "Balance mínimo"),
                chkSoloActivos.isSelected(),
                tipo);
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaClientesBalanceFrame(owner));
    }
}
