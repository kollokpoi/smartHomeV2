// helpers/httpMethodHelper.ts
import { HTTP_METHODS_ARRAY, HTTP_METHOD_LABELS, HTTP_METHOD_SEVERITY } from '@/types/constants/httpMethods'

export const httpMethodHelper = {
  getSelectOptions: () => 
    HTTP_METHODS_ARRAY.map(method => ({
      value: method,
      label: HTTP_METHOD_LABELS[method],
      severity: HTTP_METHOD_SEVERITY[method]
    })),
    
  getOptions: () =>
    HTTP_METHODS_ARRAY.map(method => ({
      value: method,
      label: method
    }))
}