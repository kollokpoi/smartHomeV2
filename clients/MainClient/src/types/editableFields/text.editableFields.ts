import type { EditableField } from "./base.editableFields";

export type EditableText = EditableField & {
    modelValue: string | null,
    maxLength?: number
}