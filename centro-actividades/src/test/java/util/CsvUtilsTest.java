package util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CsvUtilsTest {

    @TempDir
    Path tempDir;

    private static List<Object[]> rows(Object[]... data) {
        List<Object[]> list = new ArrayList<>();
        for (Object[] row : data) {
            list.add(row);
        }
        return list;
    }

    @Test
    void exportacionConEncabezados() throws Exception {
        Path file = tempDir.resolve("out.csv");
        CsvUtils.writeCsv(file, new String[]{"A", "B"}, rows(new Object[]{"1", "2"}));
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        assertEquals("A,B", lines.get(0));
        assertEquals("1,2", lines.get(1));
    }

    @Test
    void escaparComillasYComas() {
        assertEquals("\"a\"\"b\"", CsvUtils.escape("a\"b"));
        assertEquals("\"a,b\"", CsvUtils.escape("a,b"));
        assertEquals("\"a;b\"", CsvUtils.escape("a;b"));
    }

    @Test
    void escaparSaltosDeLinea() {
        String escaped = CsvUtils.escape("linea1\nlinea2");
        assertTrue(escaped.startsWith("\""));
        assertTrue(escaped.contains("linea1\nlinea2"));
    }

    @Test
    void utf8CaracteresEspeciales() throws Exception {
        Path file = tempDir.resolve("utf8.csv");
        CsvUtils.writeCsv(file, new String[]{"Nombre"}, rows(new Object[]{"José Núñez"}));
        String content = Files.readString(file, StandardCharsets.UTF_8);
        assertTrue(content.contains("José Núñez"));
    }

    @Test
    void montosConDosDecimales() {
        assertEquals("1500.50", CsvUtils.escape(MoneyUtils.of(1500.5)));
        assertEquals("0.00", CsvUtils.escape(MoneyUtils.zero()));
    }

    @Test
    void fechasYHoras() {
        assertEquals("20/07/2026", CsvUtils.escape(LocalDate.of(2026, 7, 20)));
        assertEquals("09:30", CsvUtils.escape(LocalTime.of(9, 30)));
    }

    @Test
    void tablaSinFilasSoloEncabezados() throws Exception {
        Path file = tempDir.resolve("vacio.csv");
        CsvUtils.writeCsv(file, new String[]{"Col1", "Col2"}, List.of());
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        assertEquals(1, lines.size());
        assertEquals("Col1,Col2", lines.get(0));
    }

    @Test
    void extensionAutomatica() {
        Path p = CsvUtils.ensureCsvExtension(tempDir.resolve("reporte"));
        assertTrue(p.getFileName().toString().endsWith(".csv"));
        assertEquals(tempDir.resolve("reporte.csv"), p);
    }

    @Test
    void sobrescrituraControlada() throws Exception {
        Path file = tempDir.resolve("dup.csv");
        CsvUtils.writeCsv(file, new String[]{"X"}, rows(new Object[]{"uno"}));
        CsvUtils.writeCsv(file, new String[]{"X"}, rows(new Object[]{"dos"}));
        List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        assertEquals("dos", lines.get(1));
        assertFalse(lines.stream().anyMatch(l -> l.contains("uno")));
    }

    @Test
    void buildCsvContentCompleto() {
        String csv = CsvUtils.buildCsvContent(
                new String[]{"Id", "Monto"},
                rows(new Object[]{1, new BigDecimal("10.5")}));
        assertTrue(csv.startsWith("Id,Monto"));
        assertTrue(csv.contains("10.50"));
    }
}
