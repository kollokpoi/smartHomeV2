import type { VoiceCommandAttributes } from "@/types/dto"
import type { ValidationResult } from "@/types/editableFields"

export interface VoiceCommandCreateProps {
    listIndex?: number
    blockExtended?: boolean
    class?: string
    voiceCommand: VoiceCommandAttributes
    validationState :Record<string, ValidationResult>
}