package ui.consulta;

import service.dto.ConsultaResultado;
import ui.component.ComboItem;

import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaCuotasClienteFrame extends ConsultaCuotaDualFrame {

    private final JComboBox<ComboItem<Integer>> cboCliente =
            ConsultaFilterSupport.comboClientes(java.util.List.of(), false);
    private final JTextField txtDesde = new JTextField(10);
    private final JTextField txtHasta = new JTextField(10);
    private final JComboBox<ComboItem<Boolean>> cboEstado = ConsultaFilterSupport.comboEstadoCuota();

    public ConsultaCuotasClienteFrame(Frame owner) {
        super(owner, "Consulta de cuotas por cliente",
                new String[]{"ID cuota", "Fecha", "Valor recibido", "Estado"});
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), false);
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "Cliente", cboCliente);
        ConsultaFilterSupport.addLabeled(row, "Fecha inicial", txtDesde);
        ConsultaFilterSupport.addLabeled(row, "Fecha final", txtHasta);
        ConsultaFilterSupport.addLabeled(row, "Estado", cboEstado);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), false);
        txtDesde.setText("");
        txtHasta.setText("");
        cboEstado.setSelectedIndex(0);
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarCuotasPorCliente(
                ConsultaFilterSupport.selectedId(cboCliente),
                ConsultaFilterSupport.parseDateOptional(txtDesde, "Fecha inicial"),
                ConsultaFilterSupport.parseDateOptional(txtHasta, "Fecha final"),
                ConsultaFilterSupport.selectedId(cboEstado));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaCuotasClienteFrame(owner));
    }
}
