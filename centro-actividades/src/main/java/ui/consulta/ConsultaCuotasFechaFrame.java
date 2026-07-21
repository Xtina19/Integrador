package ui.consulta;

import service.dto.ConsultaResultado;
import ui.component.ComboItem;
import util.DateUtils;

import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Frame;

public class ConsultaCuotasFechaFrame extends ConsultaCuotaDualFrame {

    private final JTextField txtFecha = new JTextField(10);
    private final JComboBox<ComboItem<Boolean>> cboEstado = ConsultaFilterSupport.comboEstadoCuota();
    private final JComboBox<ComboItem<Integer>> cboCliente =
            ConsultaFilterSupport.comboClientes(java.util.List.of(), true);

    public ConsultaCuotasFechaFrame(Frame owner) {
        super(owner, "Consulta de cuotas por fecha",
                new String[]{"ID cuota", "Fecha", "ID cliente", "Cliente", "Valor recibido", "Estado"});
        txtFecha.setText(DateUtils.format(DateUtils.today()));
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), true);
    }

    @Override
    protected JPanel buildFilterPanel() {
        JPanel wrap = new JPanel(new BorderLayout());
        wrap.setOpaque(false);
        JPanel row = ConsultaFilterSupport.row();
        ConsultaFilterSupport.addLabeled(row, "Fecha", txtFecha);
        ConsultaFilterSupport.addLabeled(row, "Estado", cboEstado);
        ConsultaFilterSupport.addLabeled(row, "Cliente", cboCliente);
        wrap.add(row, BorderLayout.CENTER);
        return wrap;
    }

    @Override
    protected void limpiarFiltros() {
        txtFecha.setText(DateUtils.format(DateUtils.today()));
        cboEstado.setSelectedIndex(0);
        ConsultaFilterSupport.reloadClientes(cboCliente, service.listarClientesCombo(), true);
    }

    @Override
    protected ConsultaResultado buscar() {
        return service.consultarCuotasPorFecha(
                ConsultaFilterSupport.parseDateRequired(txtFecha, "Fecha"),
                ConsultaFilterSupport.selectedId(cboEstado),
                ConsultaFilterSupport.selectedId(cboCliente));
    }

    public static void open(Frame owner) {
        ConsultaBaseFrame.open(new ConsultaCuotasFechaFrame(owner));
    }
}
