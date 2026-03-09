
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS'
} as const

export const HTTP_METHODS_ARRAY = Object.values(HTTP_METHODS)

export const HTTP_METHOD_LABELS: Record<HttpMethod, string> = {
  GET: 'GET (получить)',
  POST: 'POST (создать)',
  PUT: 'PUT (обновить)',
  DELETE: 'DELETE (удалить)',
  PATCH: 'PATCH (изменить)',
  OPTIONS: 'OPTIONS (опции)'
}

export const HTTP_METHOD_SEVERITY: Record<HttpMethod, string> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger',
  PATCH: 'help',
  OPTIONS: 'secondary'
}