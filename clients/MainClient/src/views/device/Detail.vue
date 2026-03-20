<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Устройство</h1>
            <p>Управление устройством</p>
        </div>
        <div class="flex gap-2">
            <Button @click="toggleEdit">{{
                isEditing ? 'Отменить' : 'Редактировать'
            }}</Button>
            <Button @click="saveAction" :disabled="!isFormValid" v-if="isEditing" severity="success">Сохранить</Button>
        </div>
    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full mb-3" v-else-if="device">
        <div class="flex w-full bg-background p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <dt class="text-sm text-foreground-dark">Название</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.name" :maxLength="100" required
                        :validationResult="validationState.name" field-name="name" @edit-start="isEditing = true"
                        @validation-change="updateValidation" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">IP адрес</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.ip" :maxLength="45" required field-name="ip"
                        :validationResult="validationState.ip" @edit-start="isEditing = true"
                        @validation-change="updateValidation" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Путь обработчика</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.handlerPath" :maxLength="255" required
                        :validationResult="validationState.handlerPath" field-name="handlerPath"
                        @edit-start="isEditing = true" @validation-change="updateValidation" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Описание</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.description" textArea
                        :validationResult="validationState.description" field-name="description"
                        @edit-start="isEditing = true" @validation-change="updateValidation" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Статус</dt>
                    <EditableSelect :isEditing="isEditing" v-model="editData.status" field-name="status"
                        :validationResult="validationState.status" :items="DeviceStatusHelper.getSelectOptions()"
                        @edit-start="isEditing = true" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Сортировка</dt>
                    <EditableNumber :isEditing="isEditing" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                        :validationResult="validationState.sortOrder" @edit-start="isEditing = true"
                        @validation-change="updateValidation" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Активно</dt>
                    <EditableSelect :isEditing="isEditing" v-model="editData.isActive" field-name="isActive"
                        :validationResult="validationState.isActive" :items="booleanOptions"
                        @edit-start="isEditing = true" />
                </div>
            </div>

            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <dt class="text-sm text-foreground-dark">ID</dt>
                    <dd>{{ device.id }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark">Последний раз виден</dt>
                    <dd>{{ formatDate(device.lastSeen) || 'Никогда' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark">Дата создания</dt>
                    <dd>{{ formatDate(device.createdAt) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark">Дата обновления</dt>
                    <dd>{{ formatDate(device.updatedAt) }}</dd>
                </div>
                <div v-if="device.actions && device.actions.length > 0">
                    <dt class="text-sm text-foreground-dark">Действия</dt>
                    <dd>{{ device.actions.length }} действий</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark">Метаданные</dt>
                    <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-60">{{
                        JSON.stringify(device.metadata, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-background w-full p-3" v-if="actions.length > 0">
        <p class="text-xl text-foreground-dark font-bold mb-4">Действия</p>
        <ActionTable :actions="actions" :loading="actionStore.loading" scroll-height="40vh"
            v-memo="[actions.length, loading]" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import { useDeviceStore } from '@/stores/modules/device.store';
import { useActionStore } from '@/stores/modules/action.store';
import { type DeviceAttributes } from '@/types/dto';
import { formatDate } from '@/helpers/formatDate';
import { DeviceStatusHelper } from '@/helpers/deviceStatusHelper';
import { booleanOptions } from '@/types/constants';
import ActionTable from '@/components/dataTables/ActionTable.vue';
import { useEntityForm } from '@/composables/useEntityForm';

const route = useRoute();
const toast = useToast();
const deviceStore = useDeviceStore();
const actionStore = useActionStore();

const id = ref<string>('');
const loading = ref<boolean>(false);

const {
    validationState,
    editData,
    isFormValid,
    isEditing,
    updateValidation,
    save,
} = useEntityForm(
    {
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
    } as DeviceAttributes,
    async (data: DeviceAttributes) => {
        return await deviceStore.updateDevice(id.value, data);
    },
);

const device = computed(() => {
    const found = deviceStore.getDeviceById(id.value);
    return found || null;
});
const actions = computed(() => actionStore.getActionsByDevice(id.value).value);

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

const loadDevice = async () => {
    loading.value = true;
    try {
        const data = await deviceStore.fetchDeviceById(id.value);
        if (data) {
            Object.assign(editData, data);
            await actionStore.fetchActions({ deviceId: id.value, limit: 5 });
        }
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось загрузить устройство",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const toggleEdit = () => {
    if (isEditing.value) {
        validationState.value = {};
        Object.assign(editData, device.value);
    }
    isEditing.value = !isEditing.value;
};

onMounted(() => {
    id.value = route.params.id as string;
    loadDevice();
});
</script>