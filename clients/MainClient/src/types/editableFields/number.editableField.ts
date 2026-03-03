import type { EditableField } from "./base.editableFields";

export type EditableNumber = EditableField & {
    modelValue: number | null,
    max?: number
    min?: number
}