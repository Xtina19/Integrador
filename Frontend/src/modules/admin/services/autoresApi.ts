import { httpGet, httpPost } from '@/services/http'
import { listAll } from '@/services/api/httpList'

const base = '/api/autores'

export interface AutorDto {
  id: string
  name: string
  firstName: string
  lastName: string
  nationality: string
  birthDate: string
  biography: string
  productCount: number
}

export interface AutorInput {
  firstName: string
  lastName?: string
  nationality?: string
  biography?: string
}

export const autoresApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    listAll<AutorDto>(base, params),
  getById: (id: string) => httpGet<AutorDto>(`${base}/${id}`),
  create: (body: AutorInput) => httpPost<AutorDto>(base, body),
}
