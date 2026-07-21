package ui.component;

import java.awt.Color;
import java.awt.Font;

/**
 * Paleta y tipografía neutras para la aplicación de escritorio.
 */
public final class UiTheme {

    public static final Color BG = new Color(245, 247, 250);
    public static final Color PANEL = Color.WHITE;
    public static final Color PRIMARY = new Color(35, 55, 80);
    public static final Color ACCENT = new Color(46, 125, 120);
    public static final Color BORDER = new Color(210, 216, 224);
    public static final Color TEXT = new Color(33, 37, 41);
    public static final Color MUTED = new Color(108, 117, 125);

    public static final Font TITLE = new Font("Segoe UI", Font.BOLD, 22);
    public static final Font SUBTITLE = new Font("Segoe UI", Font.PLAIN, 14);
    public static final Font LABEL = new Font("Segoe UI", Font.PLAIN, 13);
    public static final Font BUTTON = new Font("Segoe UI", Font.BOLD, 13);

    private UiTheme() {
    }
}
