package util;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import config.AppConfig;

import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;

/**
 * Generación de volantes de cobro con OpenPDF.
 */
public final class PdfUtils {

    private PdfUtils() {
    }

    public static Path generarVolanteCobro(Path carpetaPeriodo,
                                          String idCobro,
                                          LocalDate fecha,
                                          String periodo,
                                          Integer idCliente,
                                          String nombreCliente,
                                          String concepto,
                                          BigDecimal valorCobro,
                                          BigDecimal balanceAnterior,
                                          BigDecimal balanceActualizado) throws IOException {
        FileUtils.ensureDirectory(carpetaPeriodo);
        String safeName = (idCobro == null ? "cobro" : idCobro).replaceAll("[^A-Za-z0-9._-]", "_");
        Path pdf = carpetaPeriodo.resolve(safeName + ".pdf");

        try (OutputStream out = Files.newOutputStream(pdf)) {
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            Paragraph title = new Paragraph(AppConfig.APP_NAME, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);

            Paragraph subtitle = new Paragraph("Volante de cobro", labelFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(16f);
            doc.add(subtitle);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35f, 65f});
            addRow(table, "ID cobro", idCobro, labelFont, valueFont);
            addRow(table, "Fecha", DateUtils.format(fecha), labelFont, valueFont);
            addRow(table, "Mes facturado", periodo, labelFont, valueFont);
            addRow(table, "ID cliente", String.valueOf(idCliente), labelFont, valueFont);
            addRow(table, "Nombre completo", nombreCliente, labelFont, valueFont);
            addRow(table, "Concepto", concepto, labelFont, valueFont);
            addRow(table, "Valor del cobro", MoneyUtils.format(valorCobro), labelFont, valueFont);
            addRow(table, "Balance anterior", MoneyUtils.format(balanceAnterior), labelFont, valueFont);
            addRow(table, "Balance actualizado", MoneyUtils.format(balanceActualizado), labelFont, valueFont);
            doc.add(table);

            Paragraph footer = new Paragraph(
                    "Documento generado automáticamente el " + DateUtils.format(DateUtils.now()),
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9));
            footer.setSpacingBefore(20f);
            doc.add(footer);
            doc.close();
        } catch (DocumentException ex) {
            throw new IOException("Error al generar PDF: " + ex.getMessage(), ex);
        }
        return pdf;
    }

    private static void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        PdfPCell c2 = new PdfPCell(new Phrase(value == null ? "" : value, valueFont));
        c1.setPadding(6f);
        c2.setPadding(6f);
        c1.setBackgroundColor(new Color(240, 242, 245));
        table.addCell(c1);
        table.addCell(c2);
    }
}
