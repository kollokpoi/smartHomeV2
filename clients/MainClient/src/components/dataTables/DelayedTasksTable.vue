<!-- components/delayed/DelayedTasksTable.vue -->
<template>
    <DataTable 
        :value="tasks" 
        :loading="loading" 
        :row-class="rowClass" 
        @row-click="onRowClick"
        @row-contextmenu="onRowContextMenu" 
        :contextMenu="true" 
        class="text-xs lg:text-base rounded-lg" 
        scrollable
        :scrollHeight="scrollHeight"
    >
        <Column header="Действие" field="actionName" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.actionName }}</p>
            </template>
        </Column>
        
        <Column header="Устройство" field="deviceName" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.deviceName }}</p>
            </template>
        </Column>
        
        <Column header="IP" class="hidden lg:table-cell">
            <template #body="{ data }">
                <p>{{ data.deviceIp }}</p>
            </template>
        </Column>
        
        <Column header="Метод" field="request.method" sortable class="hidden sm:table-cell">
            <template #body="{ data }">
                <p class="text-center">{{ data.request.method }}</p>
            </template>
        </Column>
        
        <Column header="Задержка" field="delay" sortable>
            <template #body="{ data }">
                <p>{{ formatDelay(data.delay) }}</p>
            </template>
        </Column>
        
        <Column header="Осталось" field="remainingTime" sortable>
            <template #body="{ data }">
                <p :class="{ 'text-warning font-bold': data.remainingTime < 10000 }">
                    {{ formatDelay(data.remainingTime) }}
                </p>
            </template>
        </Column>
        
        <Column header="Запланирован" field="scheduledTime" sortable class="hidden lg:table-cell">
            <template #body="{ data }">
                <p>{{ formatDate(data.scheduledTime) }}</p>
            </template>
        </Column>
        
        <Column header="Действия">
            <template #body="{ data }">
                <div class="relative">
                    <Button 
                        icon="pi pi-ellipsis-h" 
                        text 
                        @click.stop="showMenu($event, data)" 
                        aria-haspopup="true" 
                    />
                </div>
            </template>
        </Column>
    </DataTable>
    
    <ContextMenu ref="contextMenuRef" :model="menuItems" />
    <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { formatDate } from '@/helpers/formatDate';
import { useActionStore } from '@/stores/modules/action.store';
import { DelayedTask } from '@/types/common/DelayedTask';
import { ContextMenu, useConfirm, useToast, type DataTableRowClickEvent, type DataTableRowContextMenuEvent } from 'primevue';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
    tasks: DelayedTask[];
    loading: boolean;
    scrollHeight?: string;
}

interface Emits {
    (e: 'cancelled'): void;
    (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emits = defineEmits<Emits>();
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null);
const toast = useToast();
const confirm = useConfirm();
const router = useRouter();

const actionStore = useActionStore();
const selectedTask = ref<DelayedTask | null>(null);

const formatDelay = (ms: number): string => {
    if (ms <= 0) return '0 сек';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours} ч ${minutes % 60} мин`;
    }
    if (minutes > 0) {
        return `${minutes} мин ${seconds % 60} сек`;
    }
    return `${seconds} сек`;
};

const rowClass = () => {
    return ['cursor-pointer text-xs lg:text-sm'];
};

const onRowContextMenu = (event: DataTableRowContextMenuEvent) => {
    contextMenuRef.value?.show(event.originalEvent);
    selectedTask.value = event.data;
};

const onRowClick = (event: DataTableRowClickEvent<DelayedTask>) => {
    const task = event.data;
    viewAction(task);
};

const viewAction = (task: DelayedTask) => {
    router.push(`/action/${task.actionId}`);
};

const cancelTask = async (task: DelayedTask) => {
    const success = await actionStore.cancelDelayedTask(task.taskId);
    if (success) {
        toast.add({
            severity: 'success',
            summary: 'Отменено',
            detail: `Задача "${task.actionName}" отменена`,
            life: 3000
        });
        emits('cancelled');
        emits('refresh');
    } else {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось отменить задачу',
            life: 3000
        });
    }
};

const cancelAllByAction = async (task: DelayedTask) => {
    confirm.require({
        message: `Отменить все отложенные запуски действия "${task.actionName}"?`,
        header: 'Подтверждение',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Отменить все',
        rejectLabel: 'Отмена',
        accept: async () => {
            const success = await actionStore.cancelAllDelayedByAction(task.actionId);
            if (success) {
                toast.add({
                    severity: 'success',
                    summary: 'Отменено',
                    detail: `Все задачи действия "${task.actionName}" отменены`,
                    life: 3000
                });
                emits('cancelled');
                emits('refresh');
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Ошибка',
                    detail: 'Не удалось отменить задачи',
                    life: 3000
                });
            }
        }
    });
};

// Контекстное меню
const menuItems = computed(() => {
    if (!selectedTask.value) return [];

    const task = selectedTask.value;

    return [
        {
            label: 'Перейти к действию',
            icon: 'pi pi-eye',
            command: () => viewAction(task)
        },
        {
            label: 'Отменить',
            icon: 'pi pi-times-circle',
            command: () => cancelTask(task)
        },
        {
            label: 'Отменить все этого действия',
            icon: 'pi pi-trash',
            command: () => cancelAllByAction(task)
        }
    ];
});

const showMenu = (event: Event, task: DelayedTask) => {
    event.stopPropagation();
    event.preventDefault();
    selectedTask.value = task;
    contextMenuRef.value?.show(event);
};
</script>

<style scoped>
.text-warning {
    color: #f59e0b;
}
</style>