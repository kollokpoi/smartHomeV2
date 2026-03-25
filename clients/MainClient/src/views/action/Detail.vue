<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-font-primary">
            <h1 class="text-2xl font-bold mb-2">{{ action ? action.name : "Действия" }}</h1>
            <p>Управление действиями</p>
        </div>
        <div class="flex gap-2">
            <Button @click="toggleEdit" :disabled="!isFormValid">{{ isEditing ? 'Отменить' : 'Редактировать'
                }}</Button>
            <Button @click="saveAction" :disabled="!isFormValid" v-if="isEditing" severity="success">Сохранить</Button>
        </div>

    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full" v-else-if="action">
        <div class="flex w-full bg-back-secondary p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.name" :maxLength="50" required
                        placeholder="Название" field-name="name" @edit-start="isEditing = true"
                        @validation-change="updateValidation" :validation-result="validationState.name" />
                </div>

                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.path" :maxLength="150" required
                        placeholder="Путь" field-name="path" @edit-start="isEditing = true"
                        @validation-change="updateValidation" :validation-result="validationState.path" />
                </div>

                <div>
                    <EditableNumber :isEditing="isEditing" v-model="editData.port" :min="1" :max="65535"
                        placeholder="Порт" field-name="port" @edit-start="isEditing = true"
                        @validation-change="updateValidation" :validation-result="validationState.port" />
                </div>

                <div>
                    <EditableSelect :isEditing="isEditing" v-model="editData.method" placeholder="Метод"
                        field-name="method" :items="httpMethodHelper.getSelectOptions()" @edit-start="isEditing = true"
                        :validation-result="validationState.method" />
                </div>

                <div>
                    <EditableText :isEditing="isEditing" v-model="editData.description" textArea placeholder="Описание"
                        field-name="description" @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.description" />
                </div>

                <div>
                    <EditableNumber :isEditing="isEditing" v-model="editData.timeout" :min="100" :max="30000"
                        placeholder="Таймаут (мс)" field-name="timeout" @edit-start="isEditing = true"
                        @validation-change="updateValidation" :validation-result="validationState.timeout" />
                </div>

                <div>
                    <EditableNumber placeholder="Сортировка" :isEditing="isEditing" v-model="editData.sortOrder"
                        :min="0" field-name="sortOrder" @edit-start="isEditing = true"
                        @validation-change="updateValidation" :validation-result="validationState.sortOrder" />
                </div>

                <div>
                    <EditableSelect :isEditing="isEditing" v-model="editData.isActive" field-name="isActive"
                        :validationResult="validationState.isActive" :items="booleanOptions" placeholder="Активно"
                        @edit-start="isEditing = true" />
                </div>

            </div>
            <div class="flex-1 flex flex-col">
                <div>
                    <dt class="text-sm text-font-primary ">Последний вызов</dt>
                    <dd class="text-font-primary">{{ formatDate(action.lastCall) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-font-primary ">Последний ответ</dt>
                    <dd class="text-font-primary">{{ action.lastResponse ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-font-primary ">Последняя ошибка</dt>
                    <dd class="text-font-primary">{{ action.lastError ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-font-primary ">Метаданные</dt>
                    <pre class="bg-back-accent text-font-primary p-4 rounded text-sm overflow-auto">{{
                        JSON.stringify(action.metadata, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>
        <ActionRequestResult v-if="callResponse" v-bind="callResponse" />
        <div class="w-full rounded-md p-4 mt-4 bg-back-secondary flex justify-end gap-4">
            <Button @click="callAction" severity="secondary">Вызвать</Button>
            <Button @click="goToActionParameters" severity="warn">Добавить параметр</Button>
            <Button @click="goToActionCommands" severity="success">Добавить голосовую команду</Button>
        </div>
        <div class="mt-4">
            <ActionParameterTable :action-parameters="actionParams || []" :loading />
        </div>
        <div class="mt-4">
            <VoiceCommandTable :voice-commands="voiceCommands || []" :loading />
        </div>
        <div class="mt-4" v-if="tasks.length > 0">
            <DelayedTasksTable :tasks="tasks" :loading="loading" @cancelled="loadTasks" @refresh="loadTasks" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';
import EditableSelect from '@/components/editableFields/EditableSelect.vue';
import ActionParameterTable from '@/components/dataTables/ActionParameterTable.vue';
import DelayedTasksTable from '@/components/dataTables/DelayedTasksTable.vue';
import { httpMethodHelper } from '@/helpers/httpMethodHelper';
import { useActionStore } from '@/stores/modules/action.store';
import type { ActionAttributes } from '@/types/dto';
import { formatDate } from '@/helpers/formatDate';
import { booleanOptions } from '@/types/constants';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import VoiceCommandTable from '@/components/dataTables/VoiceCommandTable.vue';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { useEntityForm } from '@/composables/useEntityForm';
import type { ActionCallResult } from '@/types/api';
import ActionRequestResult from '@/components/ActionRequestResult.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const actionStore = useActionStore();
const actionParametersStore = useActionParameterStore();
const voiceCommandStore = useVoiceCommandStore();
const callResponse = ref<ActionCallResult | null>(null)

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
        deviceId: '',
        name: '',
        path: '',
        port: 0,
        method: 'GET',
        description: '',
        timeout: 5000,
        sortOrder: 0,
        metadata: {}
    } as ActionAttributes,
    async (data: ActionAttributes) => {
        return await actionStore.updateAction(id.value, data);
    },
);

const action = computed(() => {
    const found = actionStore.getActionById(id.value);
    return found || null;
});
const actionParams = computed(() => actionParametersStore.getParametersByAction(id.value).value);
const voiceCommands = computed(() => voiceCommandStore.getVoiceCommandsByAction(id.value).value);
const tasks = computed(() => actionStore.delayedTasks);

const loadAction = async () => {
    loading.value = true;
    try {
        const data = await actionStore.fetchActionById(id.value);
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

const loadActionParameters = async () => {
    await actionParametersStore.fetchActionParameters({ actionId: id.value, limit: 10 });
};

const loadVoiceCommands = async () => {
    await voiceCommandStore.fetchVoiceCommands({ actionId: id.value, limit: 10 });
};

const loadTasks = async () => {
    await actionStore.fetchDelayedTasks({ actionId: id.value });
};

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

const callAction = async () => {
    try {
        const result = await actionStore.callAction(id.value)
        callResponse.value = result;
        if (result.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: `Действие "${result.data?.action.name}" выполнено`,
                life: 3000
            });
        } else {
            toast.add({
                severity: "error",
                summary: "Ошибка",
                detail: result.error?.message || "Не удалось выполнить действие",
                life: 3000
            });
        }
    } catch (err: any) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: err.message || "Не удалось выполнить действие",
            life: 3000
        });
    }
}

const goToActionCommands = () => {
    if (!action.value) return;
    router.push({
        name: 'VoiceCommandCreate',
        params: { actionId: action.value.id }
    })
}

const goToActionParameters = () => {
    if (!action.value) return;
    router.push({
        name: 'ActionParameterCreate',
        params: { actionId: action.value.id }
    })
}

const toggleEdit = () => {
    if (isEditing.value) {
        validationState.value = {};
        Object.assign(editData, action.value);
    }
    isEditing.value = !isEditing.value;
};


onMounted(async () => {
    id.value = route.params.id as string;
    await Promise.all([
        loadAction(),
        loadActionParameters(),
        loadVoiceCommands(),
        loadTasks()
    ]);
});
</script>