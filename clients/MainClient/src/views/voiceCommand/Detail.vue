<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Действия</h1>
            <p>Управление действиями</p>
        </div>
        <div class="flex gap-2" v-if="voiceCommand">
            <Button @click="updateEdit">{{ isEditing ? 'Отменить' : 'Редактировать'
            }}</Button>
            <Button @click="confirmDelete" v-if="!isEditing" severity="danger">Удалить</Button>
            <Button @click="saveVoiceCommand" :disabled="!isFormValid" v-if="isEditing" severity="success">Сохранить</Button>
        </div>

    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full" v-else-if="voiceCommand">
        <div class="flex w-full bg-background p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <label class="text-sm text-foreground-dark">Команда</label>
                    <EditableText :isEditing="isEditing" v-model="editData.command" @edit-start="isEditing = true"
                        :maxLength="50" required field-name="command" @validation-change="updateValidation"
                        :validation-result="validationState.command" text-area />
                </div>
                <div>
                    <label class="text-sm text-foreground-dark">Язык</label>
                    <EditableSelect :items="languageHelper.getSelectOptionsWithNull()" :isEditing="isEditing"
                        @edit-start="isEditing = true" v-model="editData.language" field-name="language"
                        @validation-change="updateValidation" :validation-result="validationState.language"
                        placeholder="язык" />
                </div>

                <div>
                    <label for="sortOrder" class="text-sm text-foreground-dark">Приоритет</label>
                    <EditableNumber :isEditing="isEditing" v-model="editData.priority" :min="0" field-name="priority"
                        @edit-start="isEditing = true" @validation-change="updateValidation"
                        :validation-result="validationState.priority" />
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
                    <dd>{{ formatDate(voiceCommand.createdAt) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Последние изменения</dt>
                    <dd>{{ formatDate(voiceCommand.updatedAt) }}</dd>
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
import type { VoiceCommandAttributes } from '@/types/dto';
import { formatDate } from '@/helpers/formatDate';
import { booleanOptions } from '@/types/constants';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { languageHelper } from '@/helpers/languageHelper';
import { useEntityForm } from '@/composables/useEntityForm';

const route = useRoute();
const router = useRouter();

const toast = useToast();
const confirm = useConfirm()

const voiceCommandsStore = useVoiceCommandStore();

const id = ref<string>('');
const loading = ref<boolean>(false);

const voiceCommand = computed(() => {
    const found = voiceCommandsStore.getVoiceCommandById(id.value);
    return found || null;
});

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
        command: '',
        sortOrder: 0,
        isActive: true
    } as VoiceCommandAttributes,
    async (data: VoiceCommandAttributes) => {
        return await voiceCommandsStore.updateVoiceCommand(id.value, data);
    },
);

const loadVoiceCommand = async () => {
    loading.value = true;
    try {
        const data = await voiceCommandsStore.fetchVoiceCommandById(id.value);
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
    if (!voiceCommand.value) return
    confirm.require({
        message: `Удалить параметр "${voiceCommand.value.command}"?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: async () => {
            try {
                const response = await voiceCommandsStore.deleteVoiceCommand(id.value);
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
const saveVoiceCommand = async () => {
    const result = await save()
    
    if (result.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Команда обновлена",
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

const updateEdit = () => {
    if (isEditing.value) {
        Object.assign(editData, voiceCommand.value);
        validationState.value = {};
    }
    isEditing.value = !isEditing.value;
};

onMounted(() => {
    id.value = route.params.id as string;
    loadVoiceCommand();
});
</script>