<template>
    <p>Действий{{ actionStore.totalActions }}</p>
    <p>Устройств{{ deviceStore.totalDevices }}</p>
    <p>Команд{{ voiceCommandStore.totalVoiceCommands }}</p>
    <p>Параметров{{ actionParameterStore.totalActionParameters }}</p>
    <p>{{ networkStore.apiUrl }}</p>

    <div class="p-4">
        <VoiceRecognitionButton @success="onVoiceRecorded" @start="onRecordingStart" @stop="onRecordingStop" />

        <div v-if="recognizedText" class="mt-4 p-3 bg-gray-100 rounded-lg">
            <p class="text-sm text-gray-500">Распознанный текст:</p>
            <p class="text-lg font-medium">{{ recognizedText }}</p>
        </div>
    </div>
    <div class="p-4">
        <VoiceRecognitionButton @success="onVoiceRecordedCall" @start="onRecordingStart" @stop="onRecordingStop" />
    </div>
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/modules/auth.store';
import { useThemeStore } from '@/stores/modules/theme.store';
import { useActionStore } from '@/stores/modules/action.store';
import { useDeviceStore } from '@/stores/modules/device.store';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import { useNetworkStore } from '@/stores/modules/network.store';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue';

import VoiceRecognitionButton from '@/components/VoiceRecognitionButton.vue';
import { speechService, voiceCommandService } from '@/services';

const authStore = useAuthStore();
const networkStore = useNetworkStore();
const themeStore = useThemeStore();
const actionStore = useActionStore()
const deviceStore = useDeviceStore();
const voiceCommandStore = useVoiceCommandStore();
const actionParameterStore = useActionParameterStore();

const toast = useToast();
const recognizedText = ref('');

const onVoiceRecorded = async (audioBlob: Blob) => {

    const result = await speechService.recognize(audioBlob);

    if (result.success) {
        recognizedText.value = result.data
        toast.add({
            severity: 'info',
            summary: 'Голосовая команда',
            detail: result.data,
            life: 3000
        });
    } else {
        toast.add({
            severity: 'warn',
            summary: 'Голосовая команда',
            detail: result.message || "Не получилось",
            life: 3000
        });
    }
};

const onVoiceRecordedCall = async (audioBlob: Blob) => {

    const result = await voiceCommandService.callVoiceCommand(audioBlob);

    if (result.success) {
        toast.add({
            severity: 'info',
            summary: 'Голосовая команда',
            detail: result.data,
            life: 3000
        });
    } else {
        toast.add({
            severity: 'warn',
            summary: 'Голосовая команда',
            detail: result.message || "Не получилось",
            life: 3000
        });
    }
};

const onRecordingStart = () => {
    toast.add({
        severity: 'info',
        summary: 'Запись',
        detail: 'Говорите...',
        life: 2000
    });
};

const onRecordingStop = () => {
    toast.add({
        severity: 'info',
        summary: 'Обработка',
        detail: 'Распознаю...',
        life: 1000
    });
};

const executeCommand = (text: string) => {
    // Логика выполнения команды
    console.log('Execute command:', text);
};

onMounted(() => {
    Promise.all([
        actionStore.fetchActions(),
        deviceStore.fetchDevices(),
        voiceCommandStore.fetchVoiceCommands(),
        actionParameterStore.fetchActionParameters()
    ])
})
</script>