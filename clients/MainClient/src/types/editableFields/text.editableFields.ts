import type { EditableField } from "./base.editableFields";

export interface EditableText extends EditableField {
    modelValue: string | null,
    maxLength?: number
    textArea?: boolean
}