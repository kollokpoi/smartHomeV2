<template>
    <div class="w-full">
        <label :for="fieldName" class="text-sm text-font-primary font-bold">{{placeholder}}</label>
        <dd v-if="!isEditing" class="cursor-pointer hover:bg-back-accent p-1 rounded text-font-primary" @dblclick="startEditing">
            {{ displayValue }}
        </dd>
        <InputNumber v-else v-model="localValue" :placeholder="placeholder" :disabled="disabled" :min :max
            class="w-full" />
        <div v-if="validationResult && !validationResult.isValid" class="text-red-500 text-sm mt-1">
            {{ validationResult.message }}
        </div>
    </div>
</template>
<script setup lang="ts">
import type { EditableNumber, ValidationResult } from '@/types/editableFields';
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps<EditableNumber>()
const isEditing = ref<boolean>(props.isEditing)
const localValue = ref(props.modelValue)
const validationResult = ref(props.validationResult)

const displayValue = computed(() => {
    if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
        return '—'
    }
    return props.modelValue.toString()
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'edit-start'): void
    (e: 'validation-change', value: ValidationResult): void
}>()

const validate = (): ValidationResult => {
    if (props.required && !localValue.value) {
        const result = { isValid: false, message: 'Поле обязательно для заполнения', fieldName: props.fieldName }
        return result
    }

    if (props.validators)
        for (const validator of props.validators) {
            const result = validator(localValue.value)
            if (!result.isValid) {
                return result
            }
        }

    if (props.max && localValue.value && localValue.value > props.max) {
        const result = { isValid: false, message: `Максимальное значение: ${props.max}`, fieldName: props.fieldName }
        return result
    }

    if (props.min && localValue.value && localValue.value < props.min) {
        const result = { isValid: false, message: `Минимальное значение: ${props.min}`, fieldName: props.fieldName }
        return result
    }

    return { isValid: true, fieldName: props.fieldName }
}

const startEditing = () => {
    if (props.disabled) return
    localValue.value = props.modelValue
    isEditing.value = true
    emit('edit-start')
}

watch(localValue, () => {
    validationResult.value = validate()
    emit('validation-change', validationResult.value)
    emit('update:modelValue', localValue.value || null)
})

watch(() => props.isEditing, (newVal) => {
    if (!newVal && isEditing.value) {
        localValue.value = props.modelValue as string
    }
    isEditing.value = newVal
})

watch(() => props.validationResult, (newVal) => {
    validationResult.value = newVal
}, { deep: true })

onMounted(() => {
    const validation = validate()
    emit('validation-change', validation)
})

</script>