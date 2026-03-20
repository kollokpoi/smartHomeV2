// composables/useBulkForm.ts
import { ref, computed } from 'vue'
import type { ValidationResult } from '@/types/editableFields'
import type { ApiResponse, BulkValidationError } from '@/types/api'

export function useBulkForm<T extends Record<string, any>, R = any>(
    createEmptyItem: (actionId: string) => T,
    onSave: (items: T[]) => Promise<ApiResponse<R[]>>
) {
    const items = ref<any[]>([]) // ← забили на тип
    const isSaving = ref(false)

    const hasErrors = (item: any) => {
        return Object.values(item.validationState || {}).some((v: any) => !v.isValid)
    }

    const isFormValid = computed(() => {
        return items.value.every(item => !hasErrors(item))
    })

    const init = (actionId: string, initialCount: number = 1) => {
        items.value = []
        for (let i = 0; i < initialCount; i++) {
            addItem(actionId)
        }
    }

    const addItem = (actionId: string) => {
        items.value.push({
            id: crypto.randomUUID(),
            data: createEmptyItem(actionId),
            validationState: {},
            isExpanded: true
        })
    }

    const removeItem = (id: string) => {
        const index = items.value.findIndex((item: any) => item.id === id)
        if (index > -1) {
            items.value.splice(index, 1)
        }
    }

    const updateValidation = (id: string, newState: Record<string, ValidationResult>) => {
        const item = items.value.find((item: any) => item.id === id)
        if (item) {
            item.validationState = newState  // ← заменяем целиком
        }
    }

    const setExpanded = (id: string, expanded: boolean) => {
        const item = items.value.find((item: any) => item.id === id)
        if (item) {
            item.isExpanded = expanded
        }
    }

    const applyBulkErrors = (bulkErrors: BulkValidationError[]) => {
        items.value.forEach((item: any) => {
            item.validationState = {}
        })

        bulkErrors.forEach(error => {
            const item = items.value[error.index]
            if (item) {
                error.errors.forEach(err => {
                    item.validationState[err.field] = {
                        isValid: false,
                        message: err.message,
                        fieldName: err.field
                    }
                })
                item.isExpanded = true
            }
        })
    }

    const save = async (): Promise<ApiResponse<R[]> | null> => {
        if (!isFormValid.value) return null

        isSaving.value = true
        try {
            const dataToSave = items.value.map((item: any) => item.data)
            const response = await onSave(dataToSave)

            if (!response.success && response.bulkErrors) {
                applyBulkErrors(response.bulkErrors)
            }

            return response
        } finally {
            isSaving.value = false
        }
    }

    const reset = () => {
        items.value = []
    }

    return {
        items,
        isSaving,
        isFormValid,
        hasErrors,
        init,
        addItem,
        removeItem,
        updateValidation,
        setExpanded,
        save,
        reset
    }
}