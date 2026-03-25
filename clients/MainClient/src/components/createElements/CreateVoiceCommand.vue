<template>
    <div class="w-full bg-back-secondary px-4 py-6 rounded-md" :class>
        <div class="flex items-center gap-2 cursor-pointer" @click="toggleExpand">
            <Button :icon="isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" text rounded severity="secondary"
                size="small" @click.stop="toggleExpand" />
            <slot name="header" />
        </div>
        <transition enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 max-h-0 overflow-hidden"
            enter-to-class="opacity-100 max-h-[1000px] overflow-hidden"
            leave-from-class="opacity-100 max-h-[1000px] overflow-hidden"
            leave-to-class="opacity-0 max-h-0 overflow-hidden">
            <div v-if="isExpanded" class="space-y-4">
                <div>
                    <EditableText :isEditing="true" v-model="editData.command" :maxLength="50" required
                        placeholder="Команда" field-name="command" @validation-change="updateValidation"
                        :validation-result="validationState.command" text-area />
                </div>

                <div>
                    <EditableSelect :items="languageHelper.getSelectOptionsWithNull()" :isEditing="true"
                        placeholder="Язык" v-model="editData.language" field-name="language"
                        @validation-change="updateValidation" :validation-result="validationState.language" />
                </div>
                <div>
                    <EditableNumber placeholder="Приоритет" :isEditing="true" v-model="editData.priority" :min="0"
                        field-name="priority" @validation-change="updateValidation"
                        :validation-result="validationState.priority" />
                </div>

                <div>
                    <EditableNumber placeholder="Сортировка" :isEditing="true" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                        @validation-change="updateValidation" :validation-result="validationState.sortOrder" />
                </div>

                <div>
                    <EditableSelect :isEditing="true" placeholder="Активно" v-model="editData.isActive" field-name="isActive"
                        :validationResult="validationState.isActive" :items="booleanOptions" />
                </div>
            </div>
        </transition>
        <slot name="footer">

        </slot>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import { languageHelper } from '@/helpers/languageHelper'
import type { ValidationResult } from '@/types/editableFields';
import type { VoiceCommandAttributes } from '@/types/dto/';
import { booleanOptions } from '@/types/constants';
import type { VoiceCommandCreateProps } from '@/types/props';

const props = defineProps<VoiceCommandCreateProps>()
const emit = defineEmits<{
    (e: 'update:expanded', value: boolean): void;
    (e: 'update:validationState', value: Record<string, ValidationResult>): void;
}>();

const editData = reactive<VoiceCommandAttributes>(props.voiceCommand)
const validationState = ref<Record<string, ValidationResult>>(props.validationState);
const isExpanded = ref(props.blockExtended ?? true);

const updateValidation = (result: ValidationResult) => {
    if (result.fieldName) {
        validationState.value[result.fieldName] = {
            ...result
        };
    }
};

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};


watch(isExpanded, (newVal) => {
    emit('update:expanded', newVal);
});

watch(validationState, (newVal) => {
    emit('update:validationState', newVal);
}, { deep: true });

watch(() => props.validationState, (newVal) => {
    if (newVal !== undefined) {
        validationState.value = newVal;
    }
});

watch(() => props.blockExtended, (newVal) => {
    if (newVal !== undefined) {
        isExpanded.value = newVal;
    }
});

</script>