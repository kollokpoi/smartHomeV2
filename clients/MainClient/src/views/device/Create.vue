<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Действия</h1>
            <p>Управление действиями</p>
        </div>
        <div class="flex gap-2">
            <Button @click="isEditing = !isEditing" :disabled="!isFormValid">{{ isEditing ? 'Отменить' : 'Редактировать'
                }}</Button>
            <Button @click="saveDevice" :disabled="!isFormValid" v-if="isEditing" severity="success">Сохранить</Button>
        </div>

    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full">
        <div class="w-full bg-background p-4 rounded-md gap-6">
            <div>
                <dt class="text-sm text-foreground-dark">Название</dt>
                <EditableText :isEditing="true" v-model="editData.name" :maxLength="100" required
                    :validationResult="validationState.name" field-name="name" 
                    @validation-change="updateValidation" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">IP адрес</dt>
                <EditableText :isEditing="true" v-model="editData.ip" :maxLength="45" required field-name="ip"
                    :validationResult="validationState.ip" 
                    @validation-change="updateValidation" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Путь обработчика</dt>
                <EditableText :isEditing="true" v-model="editData.handlerPath" :maxLength="255" required
                    :validationResult="validationState.handlerPath" field-name="handlerPath"
                     @validation-change="updateValidation" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Описание</dt>
                <EditableText :isEditing="true" v-model="editData.description" textArea
                    :validationResult="validationState.description" field-name="description"
                     @validation-change="updateValidation" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Статус</dt>
                <EditableSelect :isEditing="true" v-model="editData.status" field-name="status"
                    :validationResult="validationState.status" :items="DeviceStatusHelper.getSelectOptions()"
                     />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Сортировка</dt>
                <EditableNumber :isEditing="true" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                    :validationResult="validationState.sortOrder" 
                    @validation-change="updateValidation" />
            </div>

            <div>
                <dt class="text-sm text-foreground-dark">Активно</dt>
                <EditableSelect :isEditing="true" v-model="editData.isActive" field-name="isActive"
                    :validationResult="validationState.isActive" :items="booleanOptions"
                     />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import type { ValidationResult } from '@/types/editableFields';
import { useDeviceStore } from '@/stores/modules/device.store';
import type { DeviceAttributes } from '@/types/dto';
import { booleanOptions } from '@/types/constants';
import { DeviceStatusHelper } from '@/helpers/deviceStatusHelper';

const toast = useToast();
const deviceStore = useDeviceStore();

const loading = ref<boolean>(false);
const validationState = ref<Record<string, ValidationResult>>({});
const isEditing = ref<boolean>(false);

const editData = reactive<DeviceAttributes>({
    id: '',
    ip: '',
    name: '',
    handlerPath: '',
    description: '',
    status: 'offline',
    sortOrder: 0,
    isActive: true,
    lastSeen: undefined,
    metadata: {}
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

const saveDevice = async () => {
    if (!isFormValid.value) return;

    try {
        const updatedDevice = await deviceStore.createDevice(editData);
        if (updatedDevice.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: "Устройство создано",
                life: 3000
            });
            isEditing.value = false;
        } else {
            let errorMessage = updatedDevice.message;
            if (updatedDevice.errors) {
                updatedDevice.errors.forEach(error => {
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


</script>