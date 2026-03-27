<!-- components/VoiceRecognitionButton.vue -->
<template>
    <VoiceRecognitionButton @success="onVoiceRecorded" @start="onRecordingStart" @stop="onRecordingStop" :label :button-class :class :severity/>
</template>

<script setup lang="ts">
import VoiceRecognitionButton from './VoiceRecognitionButton.vue';
import { speechService } from '@/services';
import { useToast } from 'primevue';

const toast = useToast();

interface Props {
    label?: string;
    buttonClass?: string;
    class?: string;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help';
    autoStopDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Записать',
    buttonClass: '',
    severity: 'secondary',
    class: '',
    autoStopDelay: 5000
});

const emit = defineEmits<{
    (e: 'result', text: string): void;
}>();

const onVoiceRecorded = async (audioBlob: Blob) => {

    const result = await speechService.recognize(audioBlob);

    if (result.success) {
        emit('result',result.data)
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

</script>