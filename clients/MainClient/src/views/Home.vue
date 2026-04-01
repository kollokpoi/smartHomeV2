<template>
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

    <p class="text-xl text-font-primary font-bold mb-4">Девайсы</p>
    <div class="w-full overflow-x-auto mb-3">
        <div class="flex flex-wrap gap-4">
            <div v-for="device in devices" :key="device.id"
                class="relative w-32 h-32 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group bg-back-secondary"
                @click="selectedDeviceId = device.id" @dblclick="goToDevice(device.id)"
                :class="selectedDeviceId === device.id ? 'border-red-300 border-2' : ''">
                <div class="absolute inset-0 flex items-center justify-center">
                    <img v-if="device.icon" :src="device.iconPath" class="object-cover h-full" alt="" />
                    <i v-else class="pi pi-server text-5xl text-gray-500"></i>
                </div>

                <div
                    class="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span class="text-white font-medium text-center text-sm px-2 transition-opacity">
                        {{ device.name }}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <div>
        <div class="flex items-center gap-2 mb-2">
            <span class="text-font-primary">Задержка</span>
            <ToggleSwitch v-model="isUseDelay" />
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center w-full gap-2">
            <Button v-for="action in actions" @click="call(action.id)" class="text-xs md:text-sm">
                {{ action.name }}
            </Button>
        </div>
        <ActionRequestResult v-if="callResponse" v-bind="callResponse" />
    </div>

    <div class="bg-back-secondary w-full p-3 rounded-md mt-4" v-if="tasks.length>0">
        <p class="text-xl text-font-primary font-bold mb-4">Отложенные вызовы</p>
        <DelayedTasksTable :tasks="tasks" :loading="actionStore.delayedTasksLoading" @cancelled="loadTasks"
            @refresh="loadTasks" />
    </div>
    <DelayCallDialog v-model:visible="isDialogVisible" @confirm="confirmDelay" />
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/modules/auth.store';
import { useThemeStore } from '@/stores/modules/theme.store';
import { useActionStore } from '@/stores/modules/action.store';
import { useDeviceStore } from '@/stores/modules/device.store';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import { useNetworkStore } from '@/stores/modules/network.store';
import { computed, onMounted, ref, watch } from 'vue';
import DelayedTasksTable from '@/components/dataTables/DelayedTasksTable.vue';
import DelayCallDialog from '@/components/DelayCallDialog.vue';
import ActionRequestResult from '@/components/ActionRequestResult.vue';
import { useRouter } from 'vue-router';
import { useDelayedCall } from '@/composables/useDelayedCall';

const authStore = useAuthStore();
const networkStore = useNetworkStore();
const themeStore = useThemeStore();
const actionStore = useActionStore()
const deviceStore = useDeviceStore();
const voiceCommandStore = useVoiceCommandStore();
const actionParameterStore = useActionParameterStore();

const router = useRouter()

const selectedDeviceId = ref<string>();

const tasks = computed(() => actionStore.delayedTasks);
const devices = computed(() => deviceStore.devices);
const actions = computed(() => {
    if (selectedDeviceId.value)
        return actionStore.getActionsByDevice(selectedDeviceId.value).value
    else return []
});

const {
    isDialogVisible,
    isUseDelay,
    call,
    confirmDelay,
    closeDialog,
    callResponse
} = useDelayedCall({
    onSuccess: (result) => {
        loadTasks();
    },
    onError: (error) => {
        console.error('Action failed:', error);
    }
});

const loadTasks = async () => {
    await actionStore.fetchDelayedTasks();
};

const goToDevice = (id: string) => {
    router.push(`/device/${id}`)
}

watch(devices, (newVal) => {
    if (newVal.length > 0 && !selectedDeviceId.value)
        selectedDeviceId.value = newVal[0].id
});

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