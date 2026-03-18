<template>
    <div class="w-full bg-background px-4 py-6 rounded-md" :class>
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
                    <label class="text-sm text-foreground-dark">Ключ</label>
                    <EditableText :isEditing="true" v-model="editData.key" :maxLength="50" required field-name="key"
                        @validation-change="updateValidation" :validation-result="validationState.key" />
                </div>

                <div>
                    <label class="text-sm text-foreground-dark">Значение</label>
                    <EditableText :isEditing="true" v-model="editData.value" :maxLength="50" field-name="value"
                        @validation-change="updateValidation" :validation-result="validationState.value" />
                </div>

                <div>
                    <label class="text-sm text-foreground-dark">Место</label>
                    <EditableSelect :isEditing="true" v-model="editData.location" field-name="location"
                        :items="ActionParameterHelper.getLocationSelectOptions()"
                        :validation-result="validationState.location" />
                </div>

                <div>
                    <label class="text-sm text-foreground-dark">Тип значения</label>
                    <EditableSelect :isEditing="true" v-model="editData.type" field-name="type"
                        :items="ActionParameterHelper.getTypeSelectOptions()"
                        :validation-result="validationState.type" />
                </div>

                <div>
                    <label for="contentType" class="text-sm text-foreground-dark">Тип контента</label>
                    <EditableSelect :isEditing="true" v-model="editData.contentType" field-name="contentType"
                        @validation-change="updateValidation"
                        :items="ActionParameterHelper.getContentTypeSelectOptions()"
                        :validation-result="validationState.contentType" />
                </div>

                <div>
                    <label for="sortOrder" class="text-sm text-foreground-dark">Сортировка</label>
                    <EditableNumber :isEditing="true" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                        @validation-change="updateValidation" :validation-result="validationState.sortOrder" />
                </div>

                <div>
                    <label class="text-sm text-foreground-dark">Активно</label>
                    <EditableSelect :isEditing="true" v-model="editData.isActive" field-name="isActive"
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
import type { ValidationResult } from '@/types/editableFields';
import type { ActionParameterAttributes } from '@/types/dto/';
import { booleanOptions } from '@/types/constants';
import { ActionParameterHelper } from '@/helpers/actionParameterHelper';
import type { ActionParameterCreateProps } from '@/types/props';

const props = defineProps<ActionParameterCreateProps>()
const emit = defineEmits<{
    (e: 'update:expanded', value: boolean): void;
    (e: 'update:validationState', value: Record<string, ValidationResult>): void;
}>();

const editData = reactive<ActionParameterAttributes>(props.actionParameter)
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