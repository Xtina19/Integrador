export async function fetchArray<T>(url: string): Promise<T[]> {
  const res = await fetch(url)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error ${res.status} en ${url}: ${text}`)
  }

  const data = await res.json()

  if (!Array.isArray(data)) {
    throw new Error(`La API ${url} no devolvió un array: ${JSON.stringify(data)}`)
  }

  return data
}