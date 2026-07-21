package app;

import config.AppConfig;
import config.DataInitializer;
import ui.LoginFrame;

import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Punto de entrada de la aplicación.
 */
public class Main {

    private static final Logger LOGGER = Logger.getLogger(Main.class.getName());

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "No se pudo aplicar el LookAndFeel del sistema.", ex);
        }

        try {
            new DataInitializer().initialize();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error de inicialización", ex);
            JOptionPane.showMessageDialog(null,
                    "Error al inicializar el sistema:\n" + ex.getMessage(),
                    AppConfig.APP_NAME,
                    JOptionPane.ERROR_MESSAGE);
            return;
        }

        SwingUtilities.invokeLater(() -> new LoginFrame().setVisible(true));
    }
}
