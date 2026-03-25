<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-font-primary">
            <h1 class="text-2xl font-bold mb-2">Создание действия</h1>
            <p>Заполните поля для нового действия</p>
        </div>
        <Button @click="saveAction" :disabled="!isFormValid" severity="success">Сохранить</Button>
    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full">
        <div class="w-full bg-back-secondary p-4 rounded-md gap-6">
            <div>
                <EditableText :isEditing="true" v-model="editData.name" :maxLength="50" required field-name="name"
                    placeholder="Название" @validation-change="updateValidation"
                    :validation-result="validationState.name" />
            </div>
            <div>
                <EditableSelect :isEditing="true" v-model="editData.deviceId" field-name="deviceId" required
                    :items="deviceStore.deviceOptions" :validation-result="validationState.deviceId"
                    placeholder="Девайс" />
            </div>
            <div>
                <EditableText :isEditing="true" v-model="editData.path" :maxLength="150" placeholder="Путь" required
                    field-name="path" @validation-change="updateValidation" :validation-result="validationState.path" />
            </div>

            <div>
                <EditableNumber :isEditing="true" v-model="editData.port" :min="1" :max="65535"
                    placeholder="Порт" field-name="port" @validation-change="updateValidation"
                    :validation-result="validationState.port" />
            </div>

            <div>
                <EditableSelect :isEditing="true" v-model="editData.method" field-name="method" placeholder="Метод"
                    :items="httpMethodHelper.getSelectOptions()" :validation-result="validationState.method" />
            </div>

            <div>
                <EditableText :isEditing="true" v-model="editData.description" textArea placeholder="Описание"
                    field-name="description" @validation-change="updateValidation"
                    :validation-result="validationState.description" />
            </div>

            <div>
                <EditableNumber :isEditing="true" v-model="editData.timeout" :min="100" :max="30000"
                    placeholder="Таймаут (мс)" field-name="timeout" @validation-change="updateValidation"
                    :validation-result="validationState.timeout" />
            </div>

            <div>
                <EditableNumber :isEditing="true" v-model="editData.sortOrder" :min="0" placeholder="Сортировка"
                    field-name="sortOrder" @validation-change="updateValidation"
                    :validation-result="validationState.sortOrder" />
            </div>

            <div>
                <EditableSelect :isEditing="true" v-model="editData.isActive" field-name="isActive"
                    placeholder="Активно" :validationResult="validationState.isActive" :items="booleanOptions" />
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import { httpMethodHelper } from '@/helpers/httpMethodHelper';
import { useActionStore } from '@/stores/modules/action.store';
import type { ActionAttributes } from '@/types/dto';
import { booleanOptions } from '@/types/constants';
import { useEntityForm } from '@/composables/useEntityForm';
import { useRouter } from 'vue-router';
import { useDeviceStore } from '@/stores/modules/device.store';

const toast = useToast();
const actionStore = useActionStore();
const deviceStore = useDeviceStore();
const router = useRouter();

const loading = ref<boolean>(false);

const {
    validationState,
    editData,
    isFormValid,
    updateValidation,
    save,
} = useEntityForm(
    {
        deviceId: '',
        name: '',
        path: '',
        port: 0,
        method: 'GET',
        description: '',
        timeout: 5000,
        sortOrder: 0,
        isActive: true
    },
    async (data: ActionAttributes) => {
        return await actionStore.createAction(data);
    }
);
const saveAction = async () => {
    const result = await save()

    if (result.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Действие создано",
            life: 3000
        })
        router.push({
            name: 'ActionDetail',
            params: { id: result.data.id }
        })
    } else {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: result.message || "Не удалось сохранить",
            life: 3000
        })
    }
}

onMounted(async () => {
    await deviceStore.fetchDevices();
})
</script>