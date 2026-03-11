<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Действия</h1>
            <p>Управление действиями</p>
        </div>
        <div class="flex gap-2">
            <Button @click="isEditing = !isEditing" :disabled="!isFormValid">{{ isEditing ? 'Отменить' : 'Редактировать'
            }}</Button>
            <Button @click="saveAction" :disabled="!isFormValid" v-if="isEditing" severity="success">Сохранить</Button>
        </div>

    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full">
        <div class="w-full bg-background p-4 rounded-md gap-6">
            <div>
                <dt class="text-sm text-foreground-dark">Название</dt>
                <EditableText :isEditing="true" v-model="editData.name" :maxLength="50" required field-name="name"
                    @validation-change="updateValidation" :validation-result="validationState.name" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Путь</dt>
                <EditableText :isEditing="true" v-model="editData.path" :maxLength="150" required field-name="path"
                    @validation-change="updateValidation" :validation-result="validationState.path" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Порт</dt>
                <EditableNumber :isEditing="true" v-model="editData.port" :min="1" :max="65535" required
                    field-name="port" @validation-change="updateValidation" :validation-result="validationState.port" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Метод</dt>
                <EditableSelect :isEditing="true" v-model="editData.method" field-name="method"
                    :items="httpMethodHelper.getSelectOptions()" :validation-result="validationState.method" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Описание</dt>
                <EditableText :isEditing="true" v-model="editData.description" textArea field-name="description"
                    @validation-change="updateValidation" :validation-result="validationState.description" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Таймаут (мс)</dt>
                <EditableNumber :isEditing="true" v-model="editData.timeout" :min="100" :max="30000"
                    field-name="timeout" @validation-change="updateValidation"
                    :validation-result="validationState.timeout" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Сортировка</dt>
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
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import type { ValidationResult } from '@/types/editableFields';
import { httpMethodHelper } from '@/helpers/httpMethodHelper';
import { useActionStore } from '@/stores/modules/action.store';
import type { ActionAttributes } from '@/types/dto';
import { booleanOptions } from '@/types/constants';

const toast = useToast();
const actionStore = useActionStore();

const loading = ref<boolean>(false);
const validationState = ref<Record<string, ValidationResult>>({});
const isEditing = ref<boolean>(false);

const editData = reactive<ActionAttributes>({
    deviceId: '',
    name: '',
    path: '',
    port: 0,
    method: 'GET',
    description: '',
    timeout: 5000,
    sortOrder: 0,
    isActive:true
});


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

const saveAction = async () => {
    if (!isFormValid.value) return;

    try {
        const updatedAction = await actionStore.createAction(editData);
        if (updatedAction.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: "Действие обновлено",
                life: 3000
            });
            isEditing.value = false;
        } else {
            let errorMessage = updatedAction.message;
            if (updatedAction.errors) {
                updatedAction.errors.forEach(error => {
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

watch(isEditing, (newVal) => {
    if (!newVal) {
        validationState.value = {};
    }
});

onMounted(() => {

});
</script>