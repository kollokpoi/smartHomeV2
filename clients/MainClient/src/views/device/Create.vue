<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-font-primary">
            <h1 class="text-2xl font-bold mb-2">Действия</h1>
            <p>Управление действиями</p>
        </div>
        <div class="flex gap-2">
            <Button @click="saveDevice" :disabled="!isFormValid" severity="success">Сохранить</Button>
        </div>

    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full">
        <div class="w-full bg-back-secondary p-4 rounded-md gap-6">
            <div>
                <EditableText :isEditing="true" v-model="editData.name" :maxLength="100" required placeholder="Название"
                    :validationResult="validationState.name" field-name="name" @validation-change="updateValidation" />
            </div>

            <div>
                <EditableText :isEditing="true" v-model="editData.ip" :maxLength="45" required field-name="ip"
                    placeholder="IP адрес" :validationResult="validationState.ip"
                    @validation-change="updateValidation" />
            </div>
            <div>
                <EditableNumber :isEditing="true" v-model="editData.port" :min="1" :max="65535"
                    placeholder="Базовый порт" field-name="port" @validation-change="updateValidation"
                    :validation-result="validationState.port" />
            </div>
            <div>
                <EditableText :isEditing="true" v-model="editData.handlerPath" :maxLength="255" required
                    :validationResult="validationState.handlerPath" field-name="handlerPath"
                    placeholder="Путь обработчика" @validation-change="updateValidation" />
            </div>

            <div>
                <EditableText :isEditing="true" v-model="editData.description" textArea placeholder="Описание"
                    :validationResult="validationState.description" field-name="description"
                    @validation-change="updateValidation" />
            </div>

            <div>
                <EditableSelect :isEditing="true" v-model="editData.status" field-name="status" placeholder="Статус"
                    :validationResult="validationState.status" :items="DeviceStatusHelper.getSelectOptions()" />
            </div>

            <div>
                <EditableNumber :isEditing="true" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                    placeholder="Сортировка" :validationResult="validationState.sortOrder"
                    @validation-change="updateValidation" />
            </div>

            <div>
                <EditableSelect :isEditing="true" v-model="editData.isActive" field-name="isActive"
                    placeholder="Активно" :validationResult="validationState.isActive" :items="booleanOptions" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import { useDeviceStore } from '@/stores/modules/device.store';
import type { DeviceAttributes } from '@/types/dto';
import { booleanOptions } from '@/types/constants';
import { DeviceStatusHelper } from '@/helpers/deviceStatusHelper';
import { useEntityForm } from '@/composables/useEntityForm';
import router from '@/router';

const toast = useToast();
const deviceStore = useDeviceStore();
const loading = ref<boolean>(false);

const {
    validationState,
    editData,
    isFormValid,
    updateValidation,
    save,
} = useEntityForm(
    {
        ip: '',
        name: '',
        handlerPath: '',
        description: '',
        status: 'offline',
        sortOrder: 0,
        isActive: true,
        lastSeen: undefined,
        metadata: {}
    } as DeviceAttributes,
    async (data: DeviceAttributes) => {
        return await deviceStore.createDevice(data)
    },
);

const saveDevice = async () => {
    const result = await save()

    if (result.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Устройство создано",
            life: 3000
        })
        router.push({
            name: 'DeviceDetail',
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
</script>