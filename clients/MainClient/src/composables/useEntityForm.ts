// composables/useEntityForm.ts
import { ref, reactive, computed, toRaw } from 'vue'
import type { ValidationResult } from '@/types/editableFields'
import type { ApiErrorResponse, ApiResponse } from '@/types/api'

type SaveFunction<T, R> = (data: T) => Promise<ApiResponse<R>>

export function useEntityForm<T extends Record<string, any>, R = any>(
    initialData: T,
    onSave: SaveFunction<T, R>
) {
    const isEditing = ref(false)
    const validationState = ref<Record<string, ValidationResult>>({})
    const editData = reactive<T>({ ...initialData })
    const isSaving = ref(false)

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

    const save = async (): Promise<ApiResponse<R>> => {
        if (!isFormValid.value) {
            return { 
                success: false, 
                message: 'Форма содержит ошибки' 
            }
        }

        isSaving.value = true
        try {
            const rawData = toRaw(editData) as T
            const response = await onSave(rawData)
            
            if (response.success) {
                isEditing.value = false
                if (response.data) {
                    Object.assign(editData, response.data)
                }
            } else {
                if (response.errors) {
                    response.errors.forEach(error => {
                        updateValidation({
                            isValid: false,
                            message: error.message,
                            fieldName: error.field
                        })
                    })
                }
            }
            
            return response
        } catch (error: any) {
            const errorResponse : ApiErrorResponse = {
                success: false,
                message: error?.message || 'Произошла ошибка'
            } 
            return errorResponse
        } finally {
            isSaving.value = false
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
        isSaving,
        updateValidation,
        save,
        toggleEdit,
        resetForm
    }
}