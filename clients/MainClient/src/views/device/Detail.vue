<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-font-primary">
            <h1 class="text-lg sm:text-2xl font-bold mb-2">Устройство</h1>
            <p class="text-sm">Управление устройством</p>
        </div>
        <div class="flex gap-2">
            <Button @click="toggleEdit" class="text-sm sm:text-md">{{
                isEditing ? 'Отменить' : 'Редактировать'
                }}</Button>
            <Button @click="saveDevice" :disabled="!isFormValid" v-if="isEditing" severity="success"
                class="text-sm sm:text-md">Сохранить</Button>
        </div>
    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full mb-3" v-else-if="device">
        <div class=" sm:flex w-full bg-back-secondary p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.name" :maxLength="100" required
                        placeholder="Название" :validationResult="validationState.name" field-name="name"
                        @edit-start="isEditing = true" @validation-change="updateValidation" />
                </div>

                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.ip" :maxLength="45" required field-name="ip"
                        :validationResult="validationState.ip" @edit-start="isEditing = true" placeholder='IP адреc'
                        @validation-change="updateValidation" />
                </div>
                <div>
                    <EditableNumber :isEditing="isEditing" @edit-start="isEditing = true" v-model="editData.port"
                        :min="1" :max="65535" placeholder="Базовый порт" field-name="port"
                        @validation-change="updateValidation" :validation-result="validationState.port" />
                </div>
                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.handlerPath" :maxLength="255" required
                        :validationResult="validationState.handlerPath" field-name="handlerPath"
                        placeholder="Путь обработчика" @edit-start="isEditing = true"
                        @validation-change="updateValidation" />
                </div>

                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.description" textArea
                        :validationResult="validationState.description" field-name="description" placeholder="Описание"
                        @edit-start="isEditing = true" @validation-change="updateValidation" />
                </div>

                <div>
                    <EditableSelect :isEditing="isEditing" v-model="editData.status" field-name="status"
                        :validationResult="validationState.status" :items="DeviceStatusHelper.getSelectOptions()"
                        placeholder="Статус" @edit-start="isEditing = true" />
                </div>

                <div>
                    <EditableNumber :isEditing="isEditing" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                        :validationResult="validationState.sortOrder" @edit-start="isEditing = true"
                        placeholder="Сортировка" @validation-change="updateValidation" />
                </div>

                <div>
                    <EditableSelect :isEditing="isEditing" v-model="editData.isActive" field-name="isActive"
                        :validationResult="validationState.isActive" :items="booleanOptions" placeholder="Активно"
                        @edit-start="isEditing = true" />
                </div>
            </div>

            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <dt class="text-sm text-font-primary">Последний раз виден</dt>
                    <dd>{{ formatDate(device.lastSeen) || 'Никогда' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-font-primary">Дата создания</dt>
                    <dd class="text-font-primary">{{ formatDate(device.createdAt) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-font-primary">Дата обновления</dt>
                    <dd class="text-font-primary">{{ formatDate(device.updatedAt) }}</dd>
                </div>
                <div v-if="device.actions && device.actions.length > 0">
                    <dt class="text-sm text-font-primary">Действия</dt>
                    <dd class="text-font-primary">{{ device.actions.length }} действий</dd>
                </div>
                <div>
                    <dt class="text-sm text-font-primary">Метаданные</dt>
                    <pre class="hover:bg-back-accent text-font-primary p-4 rounded text-sm overflow-auto max-h-60">{{
                        JSON.stringify(device.metadata, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-back-secondary w-full p-3 rounded-md" v-if="actions.length > 0"
        :class="fullWindowMode ? 'fixed inset-0 z-50 p-6' : ''">
        <div class="w-full flex justify-between items-center">
            <p class="text-xl text-font-primary font-bold mb-4">Действия</p>
            <div class="flex items-center gap-2">
                <span class="text-font-primary">Задержка</span>
                <ToggleSwitch v-model="isUseDelay" />
                <span class="text-font-primary">Панель</span>
                <ToggleSwitch v-model="panelMode" class="mr-2" />
                <i class="pi cursor-pointer text-font-primary"
                    :class="fullWindowMode ? 'pi-window-minimize' : 'pi-arrow-up-right'"
                    @click="fullWindowMode = !fullWindowMode" />
            </div>
        </div>
        <ActionTable v-if="!panelMode" :actions="actions" :loading="actionStore.loading" scroll-height="40vh" @called="call"
            v-memo="[actions.length, loading]" />
        <div v-else>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center w-full gap-2">
                <Button v-for="action in actions" @click="call(action.id)" class="text-xs md:text-sm">
                    {{ action.name }}
                </Button>
            </div>
            <ActionRequestResult v-if="callResponse" v-bind="callResponse" />
        </div>
    </div>
    <div class="bg-back-secondary w-full p-3 rounded-md mt-4" v-if="tasks.length > 0">
        <p class="text-xl text-font-primary font-bold mb-4">Отложенные вызовы</p>
        <DelayedTasksTable :tasks="tasks" :loading="loading" @cancelled="loadTasks" @refresh="loadTasks" />
    </div>
    <DelayCallDialog v-model:visible="isDialogVisible" @confirm="confirmDelay" />
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
import ActionRequestResult from '@/components/ActionRequestResult.vue';
import DelayedTasksTable from '@/components/dataTables/DelayedTasksTable.vue';
import DelayCallDialog from '@/components/DelayCallDialog.vue';
import { useEntityForm } from '@/composables/useEntityForm';
import type { ActionCallResult } from '@/types/api';
import { useDelayedCall } from '@/composables/useDelayedCall';

const route = useRoute();
const toast = useToast();
const deviceStore = useDeviceStore();
const actionStore = useActionStore();

const panelMode = ref(false)
const fullWindowMode = ref(false)
const callResponse = ref<ActionCallResult | null>(null)

const id = ref<string>('');
const loading = ref<boolean>(false);

const {
    isDialogVisible,
    isUseDelay,
    call,
    confirmDelay,
    closeDialog
} = useDelayedCall({
    onSuccess: (result) => {
        loadTasks();
    },
    onError: (error) => {
        console.error('Action failed:', error);
    }
});

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
const tasks = computed(() => actionStore.delayedTasks);

const saveDevice = async () => {
    const result = await save()

    if (result.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Устройство обновлено",
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

const loadTasks = async () => {
    await actionStore.fetchDelayedTasks({ deviceId: id.value });
};

onMounted(async () => {
    id.value = route.params.id as string;

    await Promise.all([
        loadDevice(),
        loadTasks()
    ]);
});
</script>