// composables/useEntityForm.ts
import { ref, reactive, computed, toRaw } from 'vue'
import type { ValidationResult } from '@/types/editableFields'
import type { BulkValidationError } from '@/types/api'

type SaveFunction<T> = (data: T) => Promise<{ 
    success: boolean; 
    errors?: any[]; 
    bulkErrors?: BulkValidationError[];
    message?: string 
}>

export function useEntityForm<T extends Record<string, any>>(
    initialData: T,
    onSave: SaveFunction<T>,
    onSuccess?: () => void
) {
    const isEditing = ref(false)
    const validationState = ref<Record<string, ValidationResult>>({})
    const editData = reactive<T>({ ...initialData })

    const isFormValid = computed(() => {
        return Object.values(validationState.value).every(v => v.isValid)
    })

    const updateValidation = (result: ValidationResult) => {
        if (result.fieldName) {
            validationState.value[result.fieldName] = { ...result }
        }
    }

    const resetForm = () => {
        Object.assign(editData, initialData)
        validationState.value = {}
    }

    const save = async () => {
        if (!isFormValid.value) return false

        try {
            const rawData = toRaw(editData) as T
            const response = await onSave(rawData)
            
            if (response.success) {
                isEditing.value = false
                onSuccess?.()
                return true
            } else {
                if (response.bulkErrors && response.bulkErrors.length > 0) {
                    return { success: false, bulkErrors: response.bulkErrors }
                }
                
                if (response.errors) {
                    response.errors.forEach(error => {
                        updateValidation({
                            isValid: false,
                            message: error.message,
                            fieldName: error.field
                        })
                    })
                }
                
                return false
            }
        } catch (error) {
            return false
        }
    }

    const toggleEdit = () => {
        if (isEditing.value) {
            resetForm()
        }
        isEditing.value = !isEditing.value
    }

    return {
        isEditing,
        validationState,
        editData,
        isFormValid,
        updateValidation,
        save,
        toggleEdit,
        resetForm
    }
}