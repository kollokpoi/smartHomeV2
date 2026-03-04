import type { EditableField } from "./base.editableFields";

export type EditableNumber = EditableField & {
    modelValue: any | null,
    items: Record<string, string>
}