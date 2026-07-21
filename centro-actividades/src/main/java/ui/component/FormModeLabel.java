package ui.component;

import javax.swing.JLabel;
import java.awt.Color;

public class FormModeLabel extends JLabel {

    public enum Mode {
        CREATING("Creando", new Color(46, 125, 50)),
        EDITING("Modificando", new Color(21, 101, 192));

        private final String text;
        private final Color color;

        Mode(String text, Color color) {
            this.text = text;
            this.color = color;
        }
    }

    public FormModeLabel() {
        setFont(UiTheme.SUBTITLE);
        setCreating();
    }

    public void setCreating() {
        apply(Mode.CREATING);
    }

    public void setEditing() {
        apply(Mode.EDITING);
    }

    private void apply(Mode mode) {
        setText("Modo: " + mode.text);
        setForeground(mode.color);
    }
}
