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

    <template v-else>
        <div class="w-full mb-3 p-4 bg-back-secondary">
            <div class="w-full min-h-40 flex  justify-center bg-back-primary">
                <div class="flex flex-col items-center justify-between h-block py-2">
                    <img v-if="previewUrl" :src="previewUrl" alt="Icon"
                        class="w-full max-h-90 object-contain rounded-lg" />
                    <i v-else class="pi pi-image text-4xl text-gray-400"></i>

                    <div class="flex gap-2 mt-2">
                        <Button icon="pi pi-upload" label="Загрузить иконку" severity="secondary" outlined
                            @click="triggerFileInput" />
                        <Button v-if="previewUrl || editData.icon" icon="pi pi-refresh" label="Заменить"
                            severity="secondary" text @click="triggerFileInput" />
                    </div>

                    <div class="text-xs text-gray-500 text-center">
                        <p v-if="!previewUrl && !editData.icon" class="text-primary-500">
                        </p>
                    </div>

                    <input ref="fileInput" type="file" @change="onFileSelect"
                        accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp" class="hidden" />
                </div>
            </div>
            <div class="w-full bg-back-secondary p-4 rounded-md gap-6">
                <div>
                    <EditableText :isEditing="true" v-model="editData.name" :maxLength="100" required
                        placeholder="Название" :validationResult="validationState.name" field-name="name"
                        @validation-change="updateValidation" />
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

                <div>
                    <EditableSelect :isEditing="true" v-model="editData.isStream" field-name="isStream"
                        placeholder="Поток" :validationResult="validationState.isStream" :items="booleanOptions" />
                </div>
                <div>
                    <EditableSelect v-if="editData.isStream" :isEditing="true" v-model="editData.category" field-name="category"
                        placeholder="Категория" :validationResult="validationState.category" :items="DeviceCategoryHelper.getDeviceCategoryOptions()" />
                </div>
            </div>
        </div>
    </template>

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import { useDeviceStore } from '@/stores/modules/device.store';
import type { DeviceAttributes } from '@/types/dto';
import { booleanOptions, DEVICE_CATEGORY_ARRAY } from '@/types/constants';
import { DeviceStatusHelper } from '@/helpers/deviceStatusHelper';
import { useEntityForm } from '@/composables/useEntityForm';
import router from '@/router';
import { DeviceCategoryHelper } from '@/helpers/deviceCategoryHelper';

const toast = useToast();
const deviceStore = useDeviceStore();
const loading = ref<boolean>(false);

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string>('');
const selectedIconFile = ref<File | null>(null);


const {
    validationState,
    editData,
    isFormValid,
    setFile,
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
    async (data: DeviceAttributes, iconFile?: File) => {
        return await deviceStore.createDevice(data, iconFile)
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

const onFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        selectedIconFile.value = file;
        previewUrl.value = URL.createObjectURL(file);
        setFile(file);
    }
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

</script>