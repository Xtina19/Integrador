package ui.component;

import util.MoneyUtils;

import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableCellRenderer;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import util.DateUtils;

public class MoneyCellRenderer extends DefaultTableCellRenderer {

    public MoneyCellRenderer() {
        setHorizontalAlignment(SwingConstants.RIGHT);
    }

    @Override
    protected void setValue(Object value) {
        if (value instanceof BigDecimal money) {
            setText(MoneyUtils.format(money));
        } else if (value instanceof LocalDate date) {
            setHorizontalAlignment(SwingConstants.CENTER);
            setText(DateUtils.format(date));
        } else if (value instanceof LocalTime time) {
            setHorizontalAlignment(SwingConstants.CENTER);
            setText(DateUtils.format(time));
        } else {
            super.setValue(value);
        }
    }
}
