import type { ActionParameterAttributes } from "@/types/dto";
import type { ValidationResult } from "@/types/editableFields";

export interface ActionParameterCreateProps {
    listIndex?: number
    blockExtended?: boolean
    class?: string
    actionParameter: ActionParameterAttributes
    validationState :Record<string, ValidationResult>
}