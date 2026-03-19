<template>
    <p>Действий{{ actionStore.totalActions }}</p>
    <p>Устройств{{ deviceStore.totalDevices }}</p>
    <p>Команд{{ voiceCommandStore.totalVoiceCommands }}</p>
    <p>Параметров{{ actionParameterStore.totalActionParameters }}</p>
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/modules/auth.store';
import { useThemeStore } from '@/stores/modules/theme.store';
import { useActionStore } from '@/stores/modules/action.store';
import { useDeviceStore } from '@/stores/modules/device.store';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import { onMounted } from 'vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const actionStore = useActionStore()
const deviceStore = useDeviceStore();
const voiceCommandStore = useVoiceCommandStore();
const actionParameterStore = useActionParameterStore();


onMounted(()=>{
    Promise.all([
        actionStore.fetchActions(),
        deviceStore.fetchDevices(),
        voiceCommandStore.fetchVoiceCommands(),
        actionParameterStore.fetchActionParameters()
    ])
})
</script>