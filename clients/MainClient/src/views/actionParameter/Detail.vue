<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Действия</h1>
            <p>Управление действиями</p>
        </div>
        <div class="flex gap-2" v-if="actionParameter">
            <Button @click="updateEdit">{{ isEditing ? 'Отменить' : 'Редактировать'
            }}</Button>
            <Button @click="confirmDelete" v-if="!isEditing" severity="danger">Удалить</Button>
            <Button @click="saveAction" :disabled="!isFormValid" v-if="isEditing" severity="success">Сохранить</Button>
        </div>

    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full" v-else-if="actionParameter">
        <div class="flex w-full bg-background p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <label for="key" class="text-sm text-foreground-dark">Ключ</label>
                    <EditableText :isEditing="isEditing" v-model="editData.key" :maxLength="50" required
                        field-name="key" @validation-change="updateValidation" @edit-start="isEditing = true"
                        :validation-result="validationState.key" />
                </div>

                <div>
                    <label for="value" class="text-sm text-foreground-dark">Значение</label>
                    <EditableText :isEditing="isEditing" @edit-start="isEditing = true" v-model="editData.value"
                        :maxLength="50" field-name="value" @validation-change="updateValidation"
                        :validation-result="validationState.value" />
                </div>

                <div>
                    <label for="location" class="text-sm text-foreground-dark">Место</label>
                    <EditableSelect :isEditing="isEditing" @edit-start="isEditing = true" v-model="editData.location"
                        field-name="location" :items="ActionParameterHelper.getLocationSelectOptions()"
                        :validation-result="validationState.location" />
                </div>

                <div>
                    <label class="text-sm text-foreground-dark">Тип значения</label>
                    <EditableSelect :isEditing="isEditing" @edit-start="isEditing = true" v-model="editData.type"
                        field-name="type" :items="ActionParameterHelper.getTypeSelectOptions()"
                        :validation-result="validationState.type" />
                </div>

                <div>
                    <label for="contentType" class="text-sm text-foreground-dark">Тип контента</label>
                    <EditableSelect :isEditing="isEditing" v-model="editData.contentType" field-name="contentType"
                        @validation-change="updateValidation" @edit-start="isEditing = true"
                        :items="ActionParameterHelper.getContentTypeSelectOptions()"
                        :validation-result="validationState.contentType" />
                </div>

                <div>
                    <label for="sortOrder" class="text-sm text-foreground-dark">Сортировка</label>
                    <EditableNumber :isEditing="isEditing" @edit-start="isEditing = true" v-model="editData.sortOrder"
                        :min="0" field-name="sortOrder" @validation-change="updateValidation"
                        :validation-result="validationState.sortOrder" />
                </div>

                <div>
                    <label class="text-sm text-foreground-dark">Активно</label>
                    <EditableSelect :isEditing="isEditing" v-model="editData.isActive" field-name="isActive"
                        :validationResult="validationState.isActive" :items="booleanOptions"
                        @edit-start="isEditing = true" />
                </div>

            </div>
            <div class="flex-1 flex flex-col">
                <div>
                    <dt class="text-sm text-foreground-dark ">Дата создания</dt>
                    <dd>{{ formatDate(actionParameter.createdAt) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Последние изменения</dt>
                    <dd>{{ formatDate(actionParameter.updatedAt) }}</dd>
                </div>
            </div>
        </div>
    </div>
    <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfirm, useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import type { ActionParameterAttributes } from '@/types/dto';
import { formatDate } from '@/helpers/formatDate';
import { booleanOptions } from '@/types/constants';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import { PARAMETER_LOCATION, PARAMETER_TYPE, CONTENT_TYPE } from '@/types/constants/parameterLocation';
import { ActionParameterHelper } from '@/helpers/actionParameterHelper';
import { useEntityForm } from '@/composables/useEntityForm';

const route = useRoute();
const router = useRouter();

const toast = useToast();
const confirm = useConfirm()

const actionParametersStore = useActionParameterStore();

const id = ref<string>('');
const loading = ref<boolean>(false);

const {
    validationState,
    editData,
    isFormValid,
    updateValidation,
    isEditing,
    save,
} = useEntityForm(
    {
        actionId: '',
        key: '',
        location: PARAMETER_LOCATION.query,
        value: '',
        type: PARAMETER_TYPE.string,
        required: false,
        contentType: CONTENT_TYPE.json,
        sortOrder: 0,
        isActive: true
    } as ActionParameterAttributes,
    async (data: ActionParameterAttributes) => {
        return await actionParametersStore.updateActionParameter(id.value, data);
    },
);

const actionParameter = computed(() => {
    const found = actionParametersStore.getActionParameterById(id.value);
    return found || null;
});

const saveAction = async () => {
    const result = await save()
    
    if (result.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Действие обновлено",
            life: 3000
        })
        isEditing.value = false;
    } else {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: result.message || "Не удалось сохранить",
            life: 3000
        })
    }
}

const loadActionParameter = async () => {
    loading.value = true;
    try {
        const data = await actionParametersStore.fetchActionParameterById(id.value);
        if (data) {
            Object.assign(editData, data);
        }
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось загрузить действие",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const confirmDelete = () => {
    if (!actionParameter.value) return
    confirm.require({
        message: `Удалить параметр "${actionParameter.value.key}"?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: async () => {
            try {
                const response = await actionParametersStore.deleteActionParameter(id.value);
                if (response.success) {
                    toast.add({
                        severity: 'success',
                        summary: `Параметр удален`,
                        detail: response.message,
                        life: 3000
                    })
                    router.back();
                } else {
                    toast.add({
                        severity: 'warn',
                        summary: 'Не удалось удалить',
                        detail: response.message,
                        life: 3000
                    })
                }
            } catch (ex: any) {
                toast.add({
                    severity: 'warn',
                    summary: 'Не удалось удалить',
                    detail: 'Ошибка удаления ' + ex.message || '',
                    life: 3000
                })
            }
        }
    })
}

const updateEdit = () => {
    isEditing.value = !isEditing.value
    if (!isEditing.value)
        Object.assign(editData, actionParameter.value);
}

onMounted(() => {
    id.value = route.params.id as string;
    loadActionParameter();
});
</script>