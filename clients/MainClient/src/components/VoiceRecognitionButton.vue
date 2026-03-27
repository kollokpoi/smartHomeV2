<!-- components/VoiceRecognitionButton.vue -->
<template>
    <div class="relative inline-block">
        <Button 
            :icon="isRecording ? 'pi pi-stop' : 'pi pi-microphone'" 
            :label="label" 
            :class="buttonClass"
            :loading="isProcessing" 
            @click="handleClick" 
            :severity="severity" 
        />

        <!-- Анимация записи -->
        <div v-if="isRecording" class="absolute -top-1 -right-1">
            <span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useVoiceRecorder } from '@/composables/useVoiceRecorder';

interface Props {
    label?: string;
    buttonClass?: string;
    class?:string;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help';
    autoStopDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Записать',
    buttonClass: '',
    severity: 'secondary',
    autoStopDelay: 5000
});

const emit = defineEmits<{
    (e: 'success', audioBlob: Blob): void;
    (e: 'start'): void;
    (e: 'stop'): void;
}>();

const { isRecording, isProcessing, start, stop, onStop } = useVoiceRecorder();

onStop((audioBlob) => {
    emit('success', audioBlob);
});

const handleClick = () => {
    if (isRecording.value) {
        stop();
        emit('stop');
    } else {
        start(props.autoStopDelay);
        emit('start');
    }
};
</script>