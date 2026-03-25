<template>
    <div class="w-full flex justify-center" v-if="actionLoading">
        <ProgressSpinner />
    </div>
    <div v-else-if="action">
        <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
            <div class="text-font-primary">
                <h1 class="text-2xl font-bold mb-2">Параметры</h1>
                <p>Создание параметров для {{ action.name }}</p>
            </div>
            <Button @click="saveVoiceCommand" severity="success" :disabled="!isFormValid">Сохранить</Button>
        </div>

        <div class="w-full space-y-5">
            <CreateVoiceCommand v-for="(command, index) in items" :key="command.listIndex"
                :voice-command="command.data" :validation-state="command.validationState"
                :block-extended="command.blockExtended" @update:expanded="(val) => setExpanded(command.id, val)"
                @update:validation-state="(result) => updateValidation(command.id, result)">
                <template v-slot:header>
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <p class="text-font-primary">{{ command.data.command || 'Новый параметр' }}</p>
                            <Badge v-if="!command.blockExtended" value="Свернуто" severity="secondary" size="small" />
                            <Badge v-if="hasErrors(command)" value="!" severity="danger" size="small" />
                        </div>

                        <Badge v-if="index > 0" value="Удалить" severity="danger" @click="removeItem(command.id)" />
                    </div>
                </template>
            </CreateVoiceCommand>

            <Button @click="addItem(actionId)" class="ml-auto">Добавить</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import CreateVoiceCommand from '@/components/createElements/CreateVoiceCommand.vue';
import { useActionStore } from '@/stores/modules/action.store';
import { useRoute } from 'vue-router';
import router from '@/router';
import type { VoiceCommandAttributes } from '@/types/dto';
import { useBulkForm } from '@/composables/useBulkForm';

const toast = useToast();
const route = useRoute();
const voiceCommandStore = useVoiceCommandStore();
const actionStore = useActionStore();

const actionId = ref<string>('');
const actionLoading = computed(() => actionStore.loading);

const action = computed(() => {
    const found = actionStore.getActionById(actionId.value);
    return found || null;
});

const {
    items,
    isFormValid,
    hasErrors,
    init,
    addItem,
    removeItem,
    updateValidation,
    setExpanded,
    save
} = useBulkForm(
    (id: string) => ({
        actionId: id,
        command: '',
        isActive: true
    } as VoiceCommandAttributes),
    async (data) => {
        return await voiceCommandStore.bulkCreateVoiceCommand({
            actionId: actionId.value,
            commands: data
        })
    }
)

const saveVoiceCommand = async () => {
    const result = await save()

    if (result?.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Параметры сохранены",
            life: 3000
        })
        router.back()
    } else if (result && !result.success && !result.bulkErrors) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: result.message || "Не удалось сохранить",
            life: 3000
        })
    }
};

onMounted(async () => {
    actionId.value = route.params.actionId as string;
    await actionStore.fetchActionById(actionId.value, true)
    init(actionId.value, 1);
});

</script>