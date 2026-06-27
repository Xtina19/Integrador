import { useCallback } from 'react'
import { useToast } from '../context/ToastContext'
import { downloadCsv, downloadPdfPlaceholder } from './exportTable'

export function useTableExport(moduleName: string) {
  const { showSuccess, showInfo } = useToast()

  const onExportPdf = useCallback(() => {
    downloadPdfPlaceholder(`${moduleName.toLowerCase().replace(/\s+/g, '-')}.pdf`)
    showInfo(`Exportación PDF de ${moduleName} generada`)
  }, [moduleName, showInfo])

  const onExportExcel = useCallback(
    (headers: string[], rows: string[][]) => {
      downloadCsv(`${moduleName.toLowerCase().replace(/\s+/g, '-')}.csv`, headers, rows)
      showSuccess(`Exportación Excel de ${moduleName} completada`)
    },
    [moduleName, showSuccess]
  )

  return { onExportPdf, onExportExcel, showSuccess }
}
