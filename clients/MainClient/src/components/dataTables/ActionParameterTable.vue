<template>
    <slot name="header">

    </slot>
    <DataTable :value="actionParameters || []" :loading="loading" :row-class="rowClass" @row-click="onRowClick"
        @row-contextmenu="onRowContextMenu" :contextMenu="true" class="text-xs lg:text-base rounded-lg" scrollable
        :scrollHeight>
        <Column header="Ключ" field="key" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.key }}</p>
            </template>
        </Column>
        <Column header="Действие" field="action.name" sortable>
            <template #body="{ data }">
                <p class="font-bold">{{ data.device?.name }}</p>
            </template>
        </Column>
        <Column header="Значение" field="value" class="hidden sm:table-cell">
            <template #body="{ data }">
                <p>{{ truncateString(data.value, 50) }}</p>
            </template>
        </Column>
        <Column header="Место" field="location" class="hidden lg:table-cell">
            <template #body="{ data }">
                <Badge :severity="PARAMETER_LOCATION_SEVERITY[data.location as ParameterLocation]">{{
                    PARAMETER_LOCATION_LABELS[data.location as ParameterLocation] }}</Badge>
            </template>
        </Column>
        <Column header="Тип" field="type" class="hidden lg:table-cell">
            <template #body="{ data }">
                <Badge :severity="PARAMETER_TYPE_SEVERITY[data.type as ParameterType]">{{
                    PARAMETER_TYPE_LABELS[data.type as ParameterType] }}</Badge>
            </template>
        </Column>
        <Column header="Контент" field="contentType" class="hidden lg:table-cell">
            <template #body="{ data }">
                <Badge :severity="CONTENT_TYPE_SEVERITY[data.contentType as ContentType]">{{
                    CONTENT_TYPE_LABELS[data.contentType as ContentType] }}
                </Badge>
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
import { truncateString } from '@/helpers/truncateString';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_SEVERITY, PARAMETER_LOCATION_SEVERITY, PARAMETER_TYPE_LABELS, PARAMETER_TYPE_SEVERITY, PARAMETER_LOCATION_LABELS, type ContentType, type ParameterLocation, type ParameterType } from '@/types/constants/parameterLocation';
import { ActionParameter } from '@/types/dto';
import { ContextMenu, useConfirm, useToast, type DataTableRowClickEvent, type DataTableRowContextMenuEvent } from 'primevue';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
    actionParameters: ActionParameter[]
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

const actionParameterStore = useActionParameterStore();

const selectedParameter = ref<ActionParameter | null>(null);

const rowClass = () => {
    const classes = ['cursor-pointer text-xs lg:text-sm']
    return classes.join(' ')
}

const onRowContextMenu = (event: DataTableRowContextMenuEvent) => {
    contextMenuRef.value?.show(event.originalEvent)
    selectedParameter.value = event.data
}

const onRowClick = (event: DataTableRowClickEvent<ActionParameter>) => {
    const data = event.data;
    viewAction(data)
}

const viewAction = function (action: ActionParameter) {
    router.push(`/action-parameter/${action.id}`)
}

const menuItems = computed(() => {
    if (!selectedParameter.value) return []

    const action = selectedParameter.value

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
            command: () => router.push(`/action-parameter/${action.id}/edit`)
        },
        {
            label: 'Удалить',
            icon: 'pi pi-trash',
            command: () => confirmDelete(action)
        }
    ]
})

const showMenu = (event: Event, action: ActionParameter) => {
    event.stopPropagation()
    event.preventDefault()
    selectedParameter.value = action
    contextMenuRef.value?.show(event)
}

const confirmDelete = (action: ActionParameter) => {
    confirm.require({
        message: `Удалить параметр "${action.key}"?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: async () => {
            try {
                const response = await actionParameterStore.deleteActionParameter(action.id);
                if (response.success) {
                    toast.add({
                        severity: 'success',
                        summary: `Параметр ${action.key} удалено`,
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