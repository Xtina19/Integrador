const files = new Map<string, { blob: Blob; fileName: string }>()

export function storeFreightFile(documentId: string, blob: Blob, fileName: string) {
  files.set(documentId, { blob, fileName })
}

export function getFreightFile(documentId: string) {
  return files.get(documentId) ?? null
}

export function dataUrlToBlob(dataUrl: string, mimeType = 'application/octet-stream'): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(header)?.[1] || mimeType
  const binary = atob(data || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
