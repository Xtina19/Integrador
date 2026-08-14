import { useEffect, useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import { Input, Select } from '@/components/ui/Input'
import type { FreightCostDocument, Shipment } from '@/types/domain'
import {
  freightConceptOptions,
  freightDocumentTypes,
} from '@/modules/importaciones/business-rules/shipmentCosts'
import { trim } from '@/utils/formValidation'

export interface FreightDocumentFormInput {
  shipmentId: string
  numeroDocumento: string
  tipoDocumento: string
  concepto: string
  proveedorServicio: string
  fechaDocumento: string
  moneda: string
  monto: number
  nombreArchivo: string
  mimeType?: string
  archivo?: File
  observacion: string
}

interface FreightDocumentRecordDialogProps {
  open: boolean
  onClose: () => void
  shipments: Shipment[]
  initialShipmentId?: string
  document?: FreightCostDocument | null
  onSave: (input: FreightDocumentFormInput) => Promise<{ success: boolean; errors?: string[] }>
}

const MAX_FILE_BYTES = 25 * 1024 * 1024

const emptyForm = (shipmentId = ''): FreightDocumentFormInput => ({
  shipmentId,
  numeroDocumento: '',
  tipoDocumento: 'Factura flete',
  concepto: freightConceptOptions[0]?.label ?? 'Flete internacional',
  proveedorServicio: '',
  fechaDocumento: new Date().toISOString().slice(0, 10),
  moneda: 'USD',
  monto: 0,
  nombreArchivo: '',
  observacion: '',
})

export function FreightDocumentRecordDialog({
  open,
  onClose,
  shipments,
  initialShipmentId,
  document,
  onSave,
}: FreightDocumentRecordDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FreightDocumentFormInput>(
    emptyForm(initialShipmentId ?? shipments[0]?.id ?? ''),
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingHasFile, setExistingHasFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) return
    if (document) {
      setExistingHasFile(Boolean(document.hasFile))
      setForm({
        shipmentId: document.shipmentId,
        numeroDocumento: document.documentNumber ?? '',
        tipoDocumento: document.documentType,
        concepto: document.concept,
        proveedorServicio: document.serviceProvider,
        fechaDocumento: document.documentDate,
        moneda: document.currency,
        monto: document.amount,
        nombreArchivo: document.fileName ?? '',
        observacion: document.notes ?? '',
      })
    } else {
      setExistingHasFile(false)
      setForm(emptyForm(initialShipmentId ?? shipments[0]?.id ?? ''))
    }
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open, document, initialShipmentId, shipments])

  if (!open) return null

  async function handleSubmit() {
    if (!form.shipmentId) {
      setError('Seleccione un embarque.')
      return
    }
    if (!trim(form.proveedorServicio)) {
      setError('Indique el proveedor del servicio (agente de carga, naviera, etc.).')
      return
    }
    if (!form.monto || form.monto <= 0) {
      setError('El monto del documento debe ser mayor a cero.')
      return
    }
    if (!document && !selectedFile) {
      setError('Adjunte el documento (PDF o imagen) para guardarlo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let payload = form
      if (selectedFile) {
        payload = {
          ...form,
          nombreArchivo: selectedFile.name,
          mimeType: selectedFile.type || 'application/pdf',
          archivo: selectedFile,
        }
      }
      const result = await onSave(payload)
      if (!result.success) {
        setError(result.errors?.join(' ') ?? 'No se pudo guardar el documento.')
        return
      }
      onClose()
    } catch {
      setError('No se pudo leer el archivo adjunto. Intente con un PDF o imagen de hasta 25 MB.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {document ? 'Editar documento de flete' : 'Registrar documento de flete'}
            </h3>
            <p className="text-sm text-gray-500">Factura, BL, guía aérea o recibo — archivo guardado en base de datos</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</div>
          )}

          <Select
            label="Embarque *"
            value={form.shipmentId}
            onChange={(e) => setForm({ ...form, shipmentId: e.target.value })}
            options={shipments.map((s) => ({ value: s.id, label: `${s.code} — ${s.supplier ?? s.origin}` }))}
            disabled={Boolean(document)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de documento *"
              value={form.tipoDocumento}
              onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}
              options={freightDocumentTypes.map((t) => ({ value: t, label: t }))}
            />
            <Input
              label="Nº documento proveedor"
              value={form.numeroDocumento}
              onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })}
              placeholder="FF-2026-001 / BL-12345"
            />
            <Select
              label="Concepto de costo *"
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              options={freightConceptOptions.map((c) => ({ value: c.label, label: c.label }))}
            />
            <Input
              label="Proveedor del servicio *"
              value={form.proveedorServicio}
              onChange={(e) => setForm({ ...form, proveedorServicio: e.target.value })}
              placeholder="Agente de carga, naviera, broker aduanal"
            />
            <Input
              label="Fecha documento *"
              type="date"
              value={form.fechaDocumento}
              onChange={(e) => setForm({ ...form, fechaDocumento: e.target.value })}
            />
            <Input
              label="Monto *"
              type="number"
              min={0}
              step="0.01"
              value={form.monto || ''}
              onChange={(e) => setForm({ ...form, monto: Number(e.target.value) || 0 })}
            />
            <Select
              label="Moneda"
              value={form.moneda}
              onChange={(e) => setForm({ ...form, moneda: e.target.value })}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'DOP', label: 'DOP' },
                { value: 'GBP', label: 'GBP' },
              ]}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Archivo adjunto {document ? '(opcional al editar)' : '*'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) {
                    setSelectedFile(null)
                    return
                  }
                  if (file.size > MAX_FILE_BYTES) {
                    setError('El archivo no puede superar 25 MB.')
                    e.target.value = ''
                    setSelectedFile(null)
                    return
                  }
                  setError('')
                  setSelectedFile(file)
                  setForm((prev) => ({ ...prev, nombreArchivo: file.name, mimeType: file.type }))
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                >
                  <Paperclip size={16} />
                  Seleccionar archivo
                </button>
                <span className="text-sm text-gray-600 truncate">
                  {selectedFile
                    ? selectedFile.name
                    : existingHasFile
                      ? `Archivo en BD: ${form.nombreArchivo || 'documento adjunto'}`
                      : 'Ningún archivo seleccionado'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
            <textarea
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="px-4 py-2 text-sm font-medium text-white bg-corporate rounded-lg hover:bg-corporate/90 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : document ? 'Actualizar' : 'Registrar documento'}
          </button>
        </div>
      </div>
    </div>
  )
}
