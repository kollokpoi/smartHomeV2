<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Параметры</h1>
            <p>Управление параметрами</p>
        </div>
        <Button @click="saveActionParameter" :disabled="!isFormValid" severity="success">Сохранить</Button>
    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full">
        <div class="w-full bg-background px-4 py-6 rounded-md space-y-4">
            <div>
                <dt class="text-sm text-foreground-dark">Ключ</dt>
                <EditableText :isEditing="true" v-model="editData.key" :maxLength="50" required field-name="key"
                    @validation-change="updateValidation" :validation-result="validationState.key" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Значение</dt>
                <EditableText :isEditing="true" v-model="editData.value" :maxLength="50" field-name="value"
                    @validation-change="updateValidation" :validation-result="validationState.value" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Действие</dt>
                <EditableSelect :isEditing="true" v-model="editData.actionId" field-name="actionId"
                    :items="actionOptions" :validation-result="validationState.actionId" filter
                    :disabled="actionsLoading" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Место</dt>
                <EditableSelect :isEditing="true" v-model="editData.location" field-name="location"
                    :items="ActionParameterHelper.getLocationSelectOptions()"
                    :validation-result="validationState.location" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Тип значения</dt>
                <EditableSelect :isEditing="true" v-model="editData.type" field-name="type"
                    :items="ActionParameterHelper.getTypeSelectOptions()"
                    :validation-result="validationState.type" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Тип контента</dt>
                <EditableSelect :isEditing="true" v-model="editData.contentType" field-name="contentType"
                    :items="ActionParameterHelper.getContentTypeSelectOptions()"
                    :validation-result="validationState.contentType" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Значение</dt>
                <EditableNumber :isEditing="true" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                    @validation-change="updateValidation" :validation-result="validationState.sortOrder" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Активно</dt>
                <EditableSelect :isEditing="true" v-model="editData.isActive" field-name="isActive"
                    :validationResult="validationState.isActive" :items="booleanOptions" />
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import type { ValidationResult } from '@/types/editableFields';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import type { ActionParameterAttributes } from '@/types/dto';
import { booleanOptions } from '@/types/constants';
import { useActionStore } from '@/stores/modules/action.store';
import { CONTENT_TYPE, PARAMETER_LOCATION, PARAMETER_TYPE } from '@/types/constants/parameterLocation';
import { ActionParameterHelper } from '@/helpers/actionParameterHelper';

const toast = useToast();
const actionParameterStore = useActionParameterStore();
const actionStore = useActionStore();

const loading = ref<boolean>(false);
const validationState = ref<Record<string, ValidationResult>>({});

const actions = computed(() => actionStore.allActions);
const actionsLoading = computed(() => actionStore.loading);

const editData = reactive<ActionParameterAttributes>({
    actionId: '',
    key: '',
    location: PARAMETER_LOCATION.query,
    value: '',
    type: PARAMETER_TYPE.string,
    required: false,
    contentType: CONTENT_TYPE.json,
    sortOrder: 0,
    isActive: true
});

const actionOptions = computed(() => [
    { value: undefined, label: 'Все действия' },
    ...(actions.value?.map(x => x.selectOption)) || []
]);

const updateValidation = (result: ValidationResult) => {
    if (result.fieldName) {
        validationState.value[result.fieldName] = {
            ...result
        };
    }
};

const isFormValid = computed(() => {
    return Object.values(validationState.value).every(v => v.isValid);
});

const loadActions = async () => {
    try {
        await actionStore.fetchActions();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить действия",
            life: 3000
        });
    }
};

const saveActionParameter = async () => {
    if (!isFormValid.value) return;

    try {
        const updatedActionParameter = await actionParameterStore.createActionParameter(editData);
        if (updatedActionParameter.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: "Действие обновлено",
                life: 3000
            });
        } else {
            let errorMessage = updatedActionParameter.message;
            if (updatedActionParameter.errors) {
                updatedActionParameter.errors.forEach(error => {
                    errorMessage += `\nПоле ${error.field}`
                    updateValidation({
                        isValid: false,
                        message: error.message,
                        fieldName: error.field
                    });
                });
            }
            toast.add({
                severity: "error",
                summary: "Ошибка",
                detail: errorMessage || "Не удалось сохранить",
                life: 3000
            })
        }
    } catch {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось сохранить",
            life: 3000
        });
    }
};

onMounted(async () => {
    await loadActions()
});

</script>