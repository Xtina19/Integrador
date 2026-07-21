package ui.consulta;

import model.Cliente;
import ui.component.ComboItem;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;

import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.FlowLayout;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Utilidades compartidas para paneles de filtro de consultas.
 */
final class ConsultaFilterSupport {

    private ConsultaFilterSupport() {
    }

    static JPanel row() {
        JPanel p = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 4));
        p.setOpaque(false);
        return p;
    }

    static void addLabeled(JPanel row, String label, java.awt.Component field) {
        row.add(new JLabel(label + ":"));
        row.add(field);
    }

    static String text(JTextField field) {
        return field.getText() == null ? "" : field.getText().trim();
    }

    static LocalDate parseDateOptional(JTextField field, String nombreCampo) {
        String t = text(field);
        if (t.isEmpty()) {
            return null;
        }
        return DateUtils.parseDate(t).orElseThrow(() ->
                new ValidationException(nombreCampo, "debe tener formato dd/MM/yyyy."));
    }

    static LocalDate parseDateRequired(JTextField field, String nombreCampo) {
        LocalDate d = parseDateOptional(field, nombreCampo);
        if (d == null) {
            throw new ValidationException(nombreCampo, "es obligatoria.");
        }
        return d;
    }

    static BigDecimal parseMoneyOptional(JTextField field, String nombreCampo) {
        String t = text(field);
        if (t.isEmpty()) {
            return null;
        }
        return MoneyUtils.parse(t).orElseThrow(() ->
                new ValidationException(nombreCampo, "monto inválido."));
    }

    static Integer parseIntOptional(JTextField field) {
        String t = text(field);
        if (t.isEmpty()) {
            return null;
        }
        try {
            return Integer.valueOf(t);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    static JComboBox<ComboItem<Integer>> comboNivel() {
        JComboBox<ComboItem<Integer>> c = new JComboBox<>();
        c.addItem(new ComboItem<>(null, "Todos"));
        c.addItem(new ComboItem<>(0, "Administrador"));
        c.addItem(new ComboItem<>(1, "Usuario normal"));
        return c;
    }

    static JComboBox<ComboItem<Boolean>> comboEstadoCobro() {
        JComboBox<ComboItem<Boolean>> c = new JComboBox<>();
        c.addItem(new ComboItem<>(null, "Todos"));
        c.addItem(new ComboItem<>(false, "Pendiente"));
        c.addItem(new ComboItem<>(true, "Saldado"));
        return c;
    }

    static JComboBox<ComboItem<Boolean>> comboEstadoCuota() {
        JComboBox<ComboItem<Boolean>> c = new JComboBox<>();
        c.addItem(new ComboItem<>(null, "Todas"));
        c.addItem(new ComboItem<>(false, "Pendientes"));
        c.addItem(new ComboItem<>(true, "Aplicadas"));
        return c;
    }

    static JComboBox<ComboItem<Integer>> comboTipoCliente() {
        JComboBox<ComboItem<Integer>> c = new JComboBox<>();
        c.addItem(new ComboItem<>(null, "Todos"));
        c.addItem(new ComboItem<>(1, "Socio"));
        c.addItem(new ComboItem<>(2, "Invitado"));
        return c;
    }

    static JComboBox<ComboItem<Boolean>> comboActivo() {
        JComboBox<ComboItem<Boolean>> c = new JComboBox<>();
        c.addItem(new ComboItem<>(null, "Todos"));
        c.addItem(new ComboItem<>(true, "Activo"));
        // El modelo usa "Pasivo" como descripción de statusCliente=false
        c.addItem(new ComboItem<>(false, "Pasivo / Inactivo"));
        return c;
    }

    @SuppressWarnings("unchecked")
    static <T> T selectedId(JComboBox<ComboItem<T>> combo) {
        ComboItem<T> item = (ComboItem<T>) combo.getSelectedItem();
        return item == null ? null : item.getId();
    }

    static JComboBox<ComboItem<Integer>> comboClientes(List<Cliente> clientes, boolean incluirTodos) {
        JComboBox<ComboItem<Integer>> c = new JComboBox<>();
        if (incluirTodos) {
            c.addItem(new ComboItem<>(null, "Todos"));
        }
        for (Cliente cli : clientes) {
            c.addItem(new ComboItem<>(cli.getIdCliente(),
                    cli.getIdCliente() + " - " + cli.getNombreCompleto()));
        }
        return c;
    }

    static void reloadClientes(JComboBox<ComboItem<Integer>> combo, List<Cliente> clientes, boolean incluirTodos) {
        Integer actual = selectedId(combo);
        combo.removeAllItems();
        if (incluirTodos) {
            combo.addItem(new ComboItem<>(null, "Todos"));
        }
        for (Cliente cli : clientes) {
            combo.addItem(new ComboItem<>(cli.getIdCliente(),
                    cli.getIdCliente() + " - " + cli.getNombreCompleto()));
        }
        if (actual != null) {
            for (int i = 0; i < combo.getItemCount(); i++) {
                if (actual.equals(combo.getItemAt(i).getId())) {
                    combo.setSelectedIndex(i);
                    return;
                }
            }
        }
        if (combo.getItemCount() > 0) {
            combo.setSelectedIndex(0);
        }
    }
}
