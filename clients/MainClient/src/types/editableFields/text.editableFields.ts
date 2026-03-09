import type { EditableField } from "./base.editableFields";

export interface EditableText extends EditableField {
    modelValue?: string,
    maxLength?: number
    textArea?: boolean
}export * from './number.editableField'