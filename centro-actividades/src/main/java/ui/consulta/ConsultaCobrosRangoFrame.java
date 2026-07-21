package ui.consulta;

import service.ConsultaService;
import service.dto.ConsultaResultado;
import ui.component.ComboItem;
import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.Frame;
import java.awt.GridLayout;

public class ConsultaCobrosRangoFrame extends ConsultaBaseFrame {

    private final ConsultaService service = new ConsultaService();
    private final JTextField txtDesde = new JTextField(10);
    private final JTextField txtHasta = new JTextField(10);
    private final JComboBox<ComboItem<Integer>> cboCliente =
            ConsultaFilterSupport.comboClientes(java.util.List.of(), true);
    private final JComboBox<ComboItem<Boolean>> cboEstado = ConsultaFilterSupport.comboEstadoCobro();
    private final JTextField txtMes = new JTextField(4);
    private final JTextField txtAnio = new JTextField(6);

    public ConsultaCobrosRangoFrame(Frame owner) {
        super(owner, "Consulta de cobros por rango",
                new String[]{"ID cobro", "Fecha", "Período", "ID cliente", "Cliente",
                        "Concepto", "Valor pendiente", "Estado", "Balance actual cliente"});
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), true);
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new GridLayout(2, 1));
        wrap.setOpaque(false);
        JPanel r1 = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(r1, "Fecha inicial", txtDesde);
        ConsultaFilterSupport.addLabeled(r1, "Fecha final", txtHasta);
        ConsultaFilterSupport.addLabeled(r1, "Cliente", cboCliente);
        JPanel r2 = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(r2, "Estado", cboEstado);
        ConsultaFilterSupport.addLabeled(r2, "Mes", txtMes);
        ConsultaFilterSupport.addLabeled(r2, "Año", txtAnio);
        wrap.add(r1);
        wrap.add(r2);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtDesde.setText("");
        txtHasta.setText("");
        cboCliente.setSelectedIndex(0);
        cboEstado.setSelectedIndex(0);
        txtMes.setText("");
        txtAnio.setText("");
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), true);
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarCobrosPorRango(
                ConsultaFilterSupport.parseDateOptional(txtDesde, "Fecha inicial"),
                ConsultaFilterSupport.parseDateOptional(txtHasta, "Fecha final"),
                ConsultaFilterSupport.selectedId(cboCliente),
                ConsultaFilterSupport.selectedId(cboEstado),
                ConsultaFilterSupport.parseIntOptional(txtMes),
                ConsultaFilterSupport.parseIntOptional(txtAnio));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaCobrosRangoFrame(owner));
    }
}
