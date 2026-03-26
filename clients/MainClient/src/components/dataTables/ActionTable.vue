<template>
    <DataTable :value="actions || []" :loading="loading" :row-class="rowClass" @row-click="onRowClick"
        @row-contextmenu="onRowContextMenu" :contextMenu="true" class="text-xs lg:text-base rounded-lg" scrollable
        :scrollHeight>
        <Column header="Название" field="name" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.name }}</p>
            </template>
        </Column>
        <Column header="Устройство" field="device.name" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.device?.name }}</p>
            </template>
        </Column>
        <Column header="Путь" class="hidden lg:table-cell">
            <template #body="{ data }">
                <p>{{ getAdress(data) }}</p>
            </template>
        </Column>
        <Column header="Описание" field="description" class="hidden sm:table-cell">
            <template #body="{ data }">
                <p>{{ truncateString(data.description, 50) }}</p>
            </template>
        </Column>
        <Column header="Последний вызов" field="lastCall" sortable class="hidden lg:table-cell">
            <template #body="{ data }">
                <p>{{ formatDate(data.lastCall) }}</p>
            </template>
        </Column>
        <Column header="Количество вызовов" field="callCount" sortable class="hidden lg:table-cell">
            <template #body="{ data }">
                <p class="text-center">{{ data.callCount }}</p>
            </template>
        </Column>
        <Column header="Действия">
            <template #body="{ data }">
                <div class="relative">
                    <Button icon="pi pi-ellipsis-h" text @click.stop="showMenu($event, data)" aria-haspopup="true" />
                </div>
            </template>
        </Column>
    </DataTable>
    <ContextMenu ref="contextMenuRef" :model="menuItems" />
    <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { formatDate } from '@/helpers/formatDate';
import { truncateString } from '@/helpers/truncateString';
import { useActionStore } from '@/stores/modules/action.store';
import { Action } from '@/types/dto';
import { ContextMenu, useConfirm, useToast, type DataTableRowClickEvent, type DataTableRowContextMenuEvent } from 'primevue';
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
    actions: Action[]
    loading: boolean
    scrollHeight?: string
}
interface Emits {
    (e: 'deleted'): void
    (e: 'called', actionId: string): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
const toast = useToast()
const confirm = useConfirm()
const router = useRouter();

const actionStore = useActionStore();
const selectedAction = ref<Action | null>(null);

const rowClass = () => {
    const classes = ['cursor-pointer text-xs lg:text-sm']
    return classes.join(' ')
}

const onRowContextMenu = (event: DataTableRowContextMenuEvent) => {
    contextMenuRef.value?.show(event.originalEvent)
    selectedAction.value = event.data
}

const onRowClick = (event: DataTableRowClickEvent<Action>) => {
    const data = event.data;
    viewAction(data)
}

const getAdress = (data: Action): string => {
    return `${data.method} :${data.port}${data.path}`
}

const viewAction = function (action: Action) {
    router.push(`/action/${action.id}`)
}

// Меню для контекстного меню
const menuItems = computed(() => {
    if (!selectedAction.value) return []

    const action = selectedAction.value

    return [
        {
            label: 'Просмотреть',
            icon: 'pi pi-eye',
            command: () => viewAction(action)
        },
        {
            label: 'Редактировать',
            icon: 'pi pi-pencil',
            command: () => viewAction(action)
        },
        {
            label: 'Вызов',
            icon: 'pi pi-bolt',
            command: async () => emits('called', action.id)
        },
        {
            label: 'Удалить',
            icon: 'pi pi-trash',
            command: () => confirmDelete(action)
        }
    ]
})

const showMenu = (event: Event, action: Action) => {
    event.stopPropagation()
    event.preventDefault()
    selectedAction.value = action
    contextMenuRef.value?.show(event)
}

const confirmDelete = (action: Action) => {
    confirm.require({
        message: `Удалить действие "${action.name}"?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: async () => {
            try {
                const response = await actionStore.deleteAction(action.id);
                if (response.success) {
                    toast.add({
                        severity: 'success',
                        summary: `Действие ${action.name} удалено`,
                        detail: response.message,
                        life: 3000
                    })
                    emits('deleted')
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

</script>