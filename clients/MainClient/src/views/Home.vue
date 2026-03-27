<template>
    <p></p>

    <div class="flex w-full justify-end mb-2 gap-3">
        <Button @click="router.push('action')">
            Действий: {{ actionStore.totalActions }}
        </Button>
        <Button @click="router.push('device')">
            Устройств: {{ deviceStore.totalDevices }}
        </Button>
        <Button @click="router.push('action-parameter')">
            Команд: {{ voiceCommandStore.totalVoiceCommands }}
        </Button>
        <Button @click="router.push('voice-command')">
            Параметров: {{ actionParameterStore.totalActionParameters }}
        </Button>
    </div>
    <Badge class="mx-auto flex">Текущий адрес: {{ networkStore.apiUrl }}</Badge>
    <div class="bg-back-secondary w-full p-3 rounded-md mt-4">
        <p class="text-xl text-font-primary font-bold mb-4">Отложенные вызовы</p>
        <DelayedTasksTable :tasks="tasks" :loading="actionStore.delayedTasksLoading" @cancelled="loadTasks" @refresh="loadTasks" />
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
import { computed, onMounted } from 'vue';
import DelayedTasksTable from '@/components/dataTables/DelayedTasksTable.vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const networkStore = useNetworkStore();
const themeStore = useThemeStore();
const actionStore = useActionStore()
const deviceStore = useDeviceStore();
const voiceCommandStore = useVoiceCommandStore();
const actionParameterStore = useActionParameterStore();

const router = useRouter()

const tasks = computed(() => actionStore.delayedTasks);

const loadTasks = async () => {
    await actionStore.fetchDelayedTasks();
};


onMounted(() => {
    Promise.all([
        actionStore.fetchActions(),
        deviceStore.fetchDevices(),
        voiceCommandStore.fetchVoiceCommands(),
        actionParameterStore.fetchActionParameters(),
        loadTasks()
    ])
})
</script>