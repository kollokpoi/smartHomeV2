<template>
    <DataTable :value="devices || []" :loading="loading" :row-class="rowClass" @row-click="onRowClick"
        @row-contextmenu="onRowContextMenu" :contextMenu="true" class="text-xs lg:text-base rounded-lg" scrollable
        :scrollHeight>
        <Column header="Название" field="name" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.name }}</p>
            </template>
        </Column>
        <Column header="Адрес" field="ip">
            <template #body="{ data }">
                <p>{{ data.ip }}</p>
            </template>
        </Column>
        <Column header="Сайт" field="handlerPath" class="hidden lg:table-cell">
            <template #body="{ data }">
                <p>{{ data.handlerPath }}</p>
            </template>
        </Column>
        <Column header="Описание" field="status" class="hidden sm:table-cell">
            <template #body="{ data }">
                <p>{{ truncateString(data.description, 50) }}</p>
            </template>
        </Column>
        <Column header="Статус" field="status" class="hidden sm:table-cell">
            <template #body="{ data }">
                <Tag :severity="getDeviceSeverity(data.status)">
                    {{ getDeviceLabel(data.status) }}
                </Tag>
            </template>
        </Column>
        <Column header="Последняя активность" field="lastSeen" sortable class="hidden lg:table-cell">
            <template #body="{ data }">
                <p class="text-center">{{ formatDate(data.lastSeen) }}</p>
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
import { useDeviceStore } from '@/stores/modules/device.store';
import { getDeviceLabel, getDeviceSeverity } from '@/types/constants';
import { Device } from '@/types/dto';
import { ContextMenu, Tag, useConfirm, useToast, type DataTableRowClickEvent, type DataTableRowContextMenuEvent } from 'primevue';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
    devices: Device[]
    loading: boolean
    scrollHeight?: string
}
interface Emits {
    (e: 'deleted'): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
const toast = useToast()
const confirm = useConfirm()
const router = useRouter();
const deviceStore = useDeviceStore();

const selectedDevice = ref<Device | null>(null);

const rowClass = () => {
    const classes = ['cursor-pointer text-xs lg:text-sm']
    return classes.join(' ')
}

const onRowContextMenu = (event: DataTableRowContextMenuEvent) => {
    contextMenuRef.value?.show(event.originalEvent)
    selectedDevice.value = event.data
}

const onRowClick = (event: DataTableRowClickEvent<Device>) => {
    const data = event.data;
    viewDevice(data)
}

const viewDevice = function (device: Device) {
    router.push(`/device/${device.id}`)
}

const menuItems = computed(() => {
    if (!selectedDevice.value) return []

    const device = selectedDevice.value

    return [
        {
            label: 'Просмотреть',
            icon: 'pi pi-eye',
            command: () => viewDevice(device)
        },
        {
            label: 'Редактировать',
            icon: 'pi pi-pencil',
            command: () => viewDevice(device)
        },
        {
            label: 'Удалить',
            icon: 'pi pi-trash',
            command: () => confirmDelete(device)
        }
    ]
})

const showMenu = (event: Event, device: Device) => {
    event.stopPropagation()
    event.preventDefault()
    selectedDevice.value = device
    contextMenuRef.value?.show(event)
}

const confirmDelete = (device: Device) => {
    confirm.require({
        message: `Удалить устройство "${device.name}"?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: async () => {
            try {
                const response = await deviceStore.deleteDevice(device.id);
                if (response.success) {
                    toast.add({
                        severity: 'success',
                        summary: `Устройство ${device.name} удалено`,
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