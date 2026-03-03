export type Validator = (value: any) => ValidationResult

export interface ValidationResult {
  isValid: boolean
  message?: string
}