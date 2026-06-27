export function nowISO(): string {
  return new Date().toISOString()
}

export function nowFormatted(): string {
  const d = new Date()
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

export function relativeTime(from: Date, now = new Date()): string {
  const diffMs = now.getTime() - from.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} hora${diffH === 1 ? '' : 's'}`
  const diffD = Math.floor(diffH / 24)
  return `Hace ${diffD} día${diffD === 1 ? '' : 's'}`
}
