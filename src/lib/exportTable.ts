export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const content = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadPdfPlaceholder(filename: string) {
  const content = `LibroSys — Exportación\nArchivo: ${filename}\nGenerado: ${new Date().toLocaleString('es-DO')}\n\n(Esta exportación PDF es simulada para el entorno de demostración.)`
  const blob = new Blob([content], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.replace(/\.pdf$/i, '') + '.txt'
  link.click()
  URL.revokeObjectURL(url)
}
