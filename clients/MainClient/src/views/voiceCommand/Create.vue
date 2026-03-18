<template>
    <div class="w-full flex justify-center" v-if="actionLoading">
        <ProgressSpinner />
    </div>
    <div v-else-if="action">
        <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
            <div class="text-foreground-dark">
                <h1 class="text-2xl font-bold mb-2">Параметры</h1>
                <p>Создание параметров для {{ action.name }}</p>
            </div>
            <Button @click="saveVoiceCommand" severity="success" :disabled="!isFormValid">Сохранить</Button>
        </div>

        <div class="w-full space-y-5">
            <CreateVoiceCommand v-for="(command, index) in voiceCommands" :key="command.listIndex"
                :voice-command="command.voiceCommand" :validation-state="command.validationState"
                :block-extended="command.blockExtended" @update:expanded="(val) => command.blockExtended = val"
                @update:validation-state="(val) => command.validationState = val">
                <template v-slot:header>
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <p>{{ command.voiceCommand.command || 'Новый параметр' }}</p>
                            <Badge v-if="!command.blockExtended" value="Свернуто" severity="secondary" size="small" />
                            <Badge v-if="hasErrors(command)" value="!" severity="danger" size="small" />
                        </div>

                        <Badge v-if="index > 0" value="Удалить" severity="danger" @click="deleteBlock(index)" />
                    </div>
                </template>
            </CreateVoiceCommand>

            <Button @click="pushNewItem" class="ml-auto">Добавить</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useToast } from 'primevue';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import CreateVoiceCommand from '@/components/createElements/CreateVoiceCommand.vue';
import { useActionStore } from '@/stores/modules/action.store';
import { useRoute } from 'vue-router';
import type { VoiceCommandCreateProps } from '@/types/props';
import type { BulkValidationError } from '@/types/api';
import router from '@/router';
import type { VoiceCommandAttributes } from '@/types/dto';

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
const voiceCommands = reactive<VoiceCommandCreateProps[]>([])

const hasErrors = (param: VoiceCommandCreateProps) => {
    return Object.values(param.validationState).some(v => !v.isValid);
};

const isFormValid = computed(() => {
    const res = voiceCommands.every(param => {
        const hasValidationErrors = Object.values(param.validationState).some(v => !v.isValid);
        return !hasValidationErrors;
    });
    return res;
});

const pushNewItem = () => {
    if (!actionId.value) return;
    const newParam : VoiceCommandAttributes = {
        actionId: actionId.value,
        command: '',
        isActive:true
    }
    voiceCommands.push({
        listIndex: voiceCommands.length ?? 0,
        validationState: {},
        voiceCommand: newParam,
        blockExtended: true
    })
}

const deleteBlock = (index: number) => {
    if (voiceCommands.length <= index) return
    voiceCommands.splice(index, 1);

    voiceCommands.forEach((param, idx) => {
        param.listIndex = idx;
    });
}

const saveVoiceCommand = async () => {
    if (!isFormValid.value) return;

    try {
        const response = await voiceCommandStore.bulkCreateVoiceCommand({
            actionId: actionId.value,
            commands: voiceCommands.map(x => x.voiceCommand)
        });

        if (response.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: "Параметры сохранены",
                life: 3000
            });
            router.back()
        } else {
            if (response.bulkErrors && response.bulkErrors.length > 0) {
                voiceCommands.forEach(p => {
                    p.validationState = {};
                });

                response.bulkErrors.forEach((error: BulkValidationError) => {
                    const param = voiceCommands[error.index];
                    if (param) {
                        error.errors.forEach(err => {
                            param.validationState[err.field] = {
                                isValid: false,
                                message: err.message,
                                fieldName: err.field
                            };
                        });
                        param.blockExtended = true;
                    }
                });

                toast.add({
                    severity: "error",
                    summary: "Ошибка валидации",
                    detail: "Проверьте правильность заполнения полей",
                    life: 3000
                });
            } else if (response.errors) {
                response.errors.forEach(err => {
                    if (voiceCommands[0]) {
                        voiceCommands[0].validationState[err.field] = {
                            isValid: false,
                            message: err.message,
                            fieldName: err.field
                        };
                    }
                });

                toast.add({
                    severity: "error",
                    summary: "Ошибка",
                    detail: response.message || "Ошибка валидации",
                    life: 3000
                });
            } else {
                toast.add({
                    severity: "error",
                    summary: "Ошибка",
                    detail: response.message || "Не удалось сохранить",
                    life: 3000
                });
            }
        }
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось сохранить",
            life: 3000
        });
    }
};

onMounted(async () => {
    actionId.value = route.params.actionId as string;
    await actionStore.fetchActionById(actionId.value, true)
    pushNewItem()
});

</script>