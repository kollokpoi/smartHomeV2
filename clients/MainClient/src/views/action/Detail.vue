<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Действия</h1>
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
        <div class="flex w-full bg-background p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <dt class="text-sm text-foreground-dark">Название</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.name" :maxLength="50" required
                        field-name="name" @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.name" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Путь</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.path" :maxLength="150" required
                        field-name="path" @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.path" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Порт</dt>
                    <EditableNumber :isEditing="isEditing" v-model="editData.port" :min="1" :max="65535" required
                        field-name="port" @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.port" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Метод</dt>
                    <EditableSelect :isEditing="isEditing" v-model="editData.method" field-name="method"
                        :items="httpMethodHelper.getSelectOptions()" @edit-start="isEditing = true"
                        :validation-result="validationState.method" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Описание</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.description" textArea
                        field-name="description" @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.description" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Таймаут (мс)</dt>
                    <EditableNumber :isEditing="isEditing" v-model="editData.timeout" :min="100" :max="30000"
                        field-name="timeout" @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.timeout" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Сортировка</dt>
                    <EditableNumber :isEditing="isEditing" v-model="editData.sortOrder" :min="0" field-name="sortOrder"
                        @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.sortOrder" />
                </div>

                <div>
                    <dt class="text-sm text-foreground-dark">Активно</dt>
                    <EditableSelect :isEditing="isEditing" v-model="editData.isActive" field-name="isActive"
                        :validationResult="validationState.isActive" :items="booleanOptions"
                        @edit-start="isEditing = true" />
                </div>

            </div>
            <div class="flex-1 flex flex-col">
                <div>
                    <dt class="text-sm text-foreground-dark ">Последний вызов</dt>
                    <dd>{{ formatDate(action.lastCall) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Последний ответ</dt>
                    <dd>{{ action.lastResponse ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Последняя ошибка</dt>
                    <dd>{{ action.lastError ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Метаданные</dt>
                    <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                        JSON.stringify(action.metadata, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>
        <div class="w-full rounded-md p-4 mt-4 bg-background flex justify-end gap-4">
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
import { httpMethodHelper } from '@/helpers/httpMethodHelper';
import { useActionStore } from '@/stores/modules/action.store';
import type { ActionAttributes } from '@/types/dto';
import { formatDate } from '@/helpers/formatDate';
import { booleanOptions } from '@/types/constants';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import VoiceCommandTable from '@/components/dataTables/VoiceCommandTable.vue';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { useEntityForm } from '@/composables/useEntityForm';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const actionStore = useActionStore();
const actionParametersStore = useActionParameterStore();
const voiceCommandStore = useVoiceCommandStore();

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

const callAction = () => {

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
        loadVoiceCommands()
    ]);
});
</script>