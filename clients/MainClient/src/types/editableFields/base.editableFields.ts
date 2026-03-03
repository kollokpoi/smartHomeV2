import type { Validator } from "."

export interface EditableField {
    modelValue: any
    placeholder?: string
    isEditing: boolean
    disabled?: boolean
    validators?: Validator[]
    required?: boolean
}