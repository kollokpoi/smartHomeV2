<template>
    <slot name="header">

    </slot>
    <DataTable :value="voiceCommands || []" :loading="loading" :row-class="rowClass" @row-click="onRowClick"
        @row-contextmenu="onRowContextMenu" :contextMenu="true" class="text-xs lg:text-base rounded-lg" scrollable
        :scrollHeight>
        <Column header="Действие" field="action.name" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.action?.name }}</p>
            </template>
        </Column>
        <Column header="Команда" field="command">
            <template #body="{ data }">
                <p>{{ truncateString(data.command, 50) }}</p>
            </template>
        </Column>
        <Column header="Язык" field="language" sortable>
            <template #body="{ data }">
                <p>{{ data.language }}</p>
            </template>
        </Column>
        <Column header="Приоритет" field="priority" class="hidden sm:table-cell" sortable>
            <template #body="{ data }">
                <p>{{ data.priority }}</p>
            </template>
        </Column>
        <Column header="Вызовов" field="usageCount" class="hidden sm:table-cell" sortable>
            <template #body="{ data }">
                <p>{{ data.usageCount }}</p>
            </template>
        </Column>
        <Column header="Последный вызов" field="lastUsed" class="hidden sm:table-cell" sortable>
            <template #body="{ data }">
                <p>{{ formatDate(data.lastUsed)  }}</p>
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
    <slot name="footer">

    </slot>
    <ContextMenu ref="contextMenuRef" :model="menuItems" />
    <ConfirmDialog :draggable="true" />
</template>

<script setup lang="ts">
import { formatDate } from '@/helpers/formatDate';
import { truncateString } from '@/helpers/truncateString';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import { VoiceCommand } from '@/types/dto';
import { ContextMenu, useConfirm, useToast, type DataTableRowClickEvent, type DataTableRowContextMenuEvent } from 'primevue';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
    voiceCommands: VoiceCommand[]
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

const voiceCommandStore = useVoiceCommandStore();

const selectedCommand = ref<VoiceCommand | null>(null);

const rowClass = () => {
    const classes = ['cursor-pointer text-xs lg:text-sm']
    return classes.join(' ')
}

const onRowContextMenu = (event: DataTableRowContextMenuEvent) => {
    contextMenuRef.value?.show(event.originalEvent)
    selectedCommand.value = event.data
}

const onRowClick = (event: DataTableRowClickEvent<VoiceCommand>) => {
    const data = event.data;
    viewCommand(data)
}

const viewCommand = function (voiceCommand: VoiceCommand) {
    router.push(`/voice-command/${voiceCommand.id}`)
}

const menuItems = computed(() => {
    if (!selectedCommand.value) return []

    const voiceCommand = selectedCommand.value

    return [
        {
            label: 'Просмотреть',
            icon: 'pi pi-eye',
            command: () => viewCommand(voiceCommand)
        },
        {
            label: 'Редактировать',
            icon: 'pi pi-pencil',
            command: () => viewCommand(voiceCommand)
        },
        {
            label: 'Удалить',
            icon: 'pi pi-trash',
            command: () => confirmDelete(voiceCommand)
        }
    ]
})

const showMenu = (event: Event, voiceCommand: VoiceCommand) => {
    event.stopPropagation()
    event.preventDefault()
    selectedCommand.value = voiceCommand
    contextMenuRef.value?.show(event)
}

const confirmDelete = (voiceCommand: VoiceCommand) => {
    confirm.require({
        message: `Удалить команду "${voiceCommand.command}"?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: async () => {
            try {
                const response = await voiceCommandStore.deleteVoiceCommand(voiceCommand.id);
                if (response.success) {
                    toast.add({
                        severity: 'success',
                        summary: `Команда удаленf`,
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