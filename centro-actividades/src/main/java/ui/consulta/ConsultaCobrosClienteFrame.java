package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;
import ui.component.ComboItem;

import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaCobrosClienteFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JComboBox<ComboItem<Integer>> cboCliente =
            ConsultaFilterSupport.comboClientes(java.util.List.of(), false);
    private final JComboBox<ComboItem<Boolean>> cboEstado = ConsultaFilterSupport.comboEstadoCobro();
    private final JTextField txtDesde = new JTextField(10);
    private final JTextField txtHasta = new JTextField(10);

    public ConsultaCobrosClienteFrame(Frame owner) {
        super(owner, "Consulta de cobros por cliente",
                new String[]{"ID cobro", "Fecha", "Concepto", "Valor pendiente", "Estado"});
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), false);
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "Cliente", cboCliente);
        ConsultaFilterSupport.addLabeled(row, "Estado", cboEstado);
        ConsultaFilterSupport.addLabeled(row, "Fecha inicial", txtDesde);
        ConsultaFilterSupport.addLabeled(row, "Fecha final", txtHasta);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), false);
        cboEstado.setSelectedIndex(0);
        txtDesde.setText("");
        txtHasta.setText("");
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarCobrosPorCliente(
                ConsultaFilterSupport.selectedId(cboCliente),
                ConsultaFilterSupport.selectedId(cboEstado),
                ConsultaFilterSupport.parseDateOptional(txtDesde, "Fecha inicial"),
                ConsultaFilterSupport.parseDateOptional(txtHasta, "Fecha final"));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaCobrosClienteFrame(owner));
    }
}
