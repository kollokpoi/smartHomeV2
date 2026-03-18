<template>
    <div class="w-full">
        <dd v-if="!isEditing" class="cursor-pointer hover:bg-gray-50 p-1 rounded" @dblclick="startEditing">
            <Badge :severity="getSeverity(localValue)">{{ displayValue }}</Badge>
        </dd>
        <Select v-else v-model="localValue" :placeholder="placeholder" :disabled="disabled" class="w-full" :id="fieldName"
            :filter="filter" :options="items" :optionLabel="optionLabel || 'label'"
            :optionValue="optionValue || 'value'">
            <template #value="slotProps">
                <Tag v-if="slotProps.value !== undefined && slotProps.value !== null"
                    :severity="getSeverity(slotProps.value)" :value="getLabel(slotProps.value)" />
                <span v-else>{{ placeholder }}</span>
            </template>

            <template #option="slotProps">
                <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
            </template>
        </Select>

        <div v-if="validationResult && !validationResult.isValid" class="text-red-500 text-sm mt-1">
            {{ validationResult.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import type { EditableSelect, ValidationResult } from '@/types/editableFields';
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps<EditableSelect>()
const isEditing = ref<boolean>(props.isEditing)
const localValue = ref(props.modelValue)
const validationResult = ref(props.validationResult)

const getItemByValue = (value: any) => {
    return props.items.find(item => item.value === value)
}

const getLabel = (value: any) => {
    const item = getItemByValue(value)
    return item ? item.label : value
}

const getSeverity = (value: any) => {
    const item = getItemByValue(value)
    return item?.severity || 'secondary'
}

const displayValue = computed(() => {
    if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
        return '—'
    }
    const item = getItemByValue(props.modelValue)
    if (item?.severity) {
        return props.modelValue.toString()
    }
    return props.modelValue.toString()
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'edit-start'): void
    (e: 'validation-change', value: ValidationResult): void
}>()

const validate = (): ValidationResult => {
    if (props.required && (!localValue.value || localValue.value.trim() === '')) {
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
    emit('update:modelValue', localValue.value)
})

watch(() => props.isEditing, (newVal) => {
    if (!newVal && isEditing.value) {
        localValue.value = props.modelValue
    }
    isEditing.value = newVal
})

watch(() => props.validationResult, (newVal) => {
    validationResult.value = newVal
})

onMounted(() => {
    validationResult.value = validate()
    emit('validation-change', validationResult.value)
})
</script>