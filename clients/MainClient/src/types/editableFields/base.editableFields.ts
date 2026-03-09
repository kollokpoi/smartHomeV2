import type { ValidationResult, Validator } from ".";

export interface EditableField {
  modelValue?: any;
  placeholder?: string;
  isEditing: boolean;
  disabled?: boolean;
  validators?: Validator[];
  validationResult?: ValidationResult;
  required?: boolean;
  fieldName: string;
}
