<template>
    <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Действия</h1>
        <p class="text-gray-600">Управление действиями</p>
    </div>

    <div class="flex w-full mb-3">
        <InputText class="flex-1" placeholder="Поиск" v-model="searchText" :disabled="loading" />
        <Button class="mx-2" label="Фильтры" icon="pi pi-filter" @click="showFilter = !showFilter"
            :badge="hasActiveFilters ? '!' : undefined" :severity="hasActiveFilters ? 'warning' : 'secondary'"
            :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
    </div>
    <div class="flex min-h-screen relative">
        <div class="flex-1">
            <ActionTable :actions="actions" :loading @deleted="loadActions" />
            <Paginator v-if="pagination?.total > pagination.limit" :rows="pagination.limit"
                :totalRecords="pagination.total" @page="onPageChange" />
        </div>

        <div class="fixed top-0 h-full z-50 pointer-events-none transition-all duration-300 ease-out" :class="[
            isExpanded ? 'right-0' :
                isHovered ? '-right-115' : '-right-120'
        ]" @mouseenter="onHover(true)" @mouseleave="onHover(false)">

            <div class="relative h-full pointer-events-auto">
                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-48 bg-muted  rounded-l-lg shadow-lg cursor-pointer z-10"
                    @click="togglePanel">
                    <div class="h-full flex items-center justify-center">
                        <span class="transform -rotate-90 whitespace-nowrap text-foreground-light font-medium text-sm">
                            {{ isExpanded ? 'Свернуть' : 'Панель действий' }}
                        </span>
                    </div>
                </div>

                <div class="ml-8 w-120 h-full bg-muted shadow-2xl overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl text-foreground-dark font-bold">Панель действий</h3>
                            <Button icon="pi pi-times" text rounded @click.stop="isExpanded = false" />
                        </div>
                        <div class="space-y-4 flex flex-col items-center gap-2">
                            <Button label="Создать новое" icon="pi pi-plus" severity="success" class="w-full" @click="addApplication" />
                            <Button label="Статистика" icon="pi pi-history" class="w-full" @click="addApplication" />
                            <Button label="К девайсам" icon="pi pi-pencil" severity="warn" class="w-full" @click="addApplication" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Dialog :visible="showFilter" class="w-3/4 h-200" modal :closable="false">
        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-sm font-medium mb-2">Устройство</label>
                <Select v-model="tempFilters.deviceId" :options="deviceOptions" class="w-full" filter
                    optionLabel="label" optionValue="value" placeholder="Все устройства" />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Метод</label>
                <Select v-model="tempFilters.method" :options="localMethodOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все методы" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Время ожидания</label>
                <div class="flex w-full justify-between items-center">
                    <InputNumber class="flex-1" placeholder="от" v-model="tempFilters.minTimeout" :min="0" />
                    <i class="pi pi-arrow-right mx-2"></i>
                    <InputNumber class="flex-1" placeholder="до" v-model="tempFilters.maxTimeout" :min="0" />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Последний вызов</label>
                <div class="flex w-full justify-between items-center">
                    <DatePicker class="flex-1" placeholder="от" v-model="tempFilters.lastCallFrom" :min="0" />
                    <i class="pi pi-arrow-right mx-2"></i>
                    <DatePicker class="flex-1" placeholder="до" v-model="tempFilters.lastCallFrom" :min="0" />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Минимум вызовов</label>
                <InputNumber class="w-full" placeholder="Минимум вызовов" v-model="tempFilters.minCallCount" :min="0" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Есть ошибки</label>
                <Select v-model="tempFilters.hasError" :options="checkboxOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Не выбрано" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-2">Активно</label>
                <Select v-model="tempFilters.isActive" :options="checkboxOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Не выбрано" />
            </div>
        </div>
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Сбросить" icon="pi pi-filter-slash" @click="resetFilter" outlined severity="secondary" />
                <div class="flex gap-2">
                    <Button label="Отмена" @click="showFilter = false" outlined />
                    <Button label="Применить" @click="applyFilters" icon="pi pi-check" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import ActionTable from '@/components/dataTables/ActionTable.vue';
import type { Action, Device } from '@/types/dto';
import debounce from 'lodash/debounce'
import { ref, computed, onMounted, reactive, watch, onUnmounted } from 'vue';
import { useToast } from 'primevue';
import { actionService, deviceService } from '@/services';
import type { ApiPaginationResponse, Pagination } from '@/types/api';
import type { ActionFilters } from '@/types/searchParams';
import { methodOptions } from '@/types/common/options/Method.options';
import router from '@/router';
import { PaginationParamsFactory } from '@/lib/pagination/factory';

const actions = ref<Action[]>([])
const devices = ref<Device[]>([])

const toast = useToast();

const loading = ref(false);
const showFilter = ref(false)

const isExpanded = ref(false)
const isHovered = ref(false)

const pagination = reactive<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
})

const searchParams = reactive<ActionFilters>({})
const tempFilters = reactive<ActionFilters>({})

const searchText = ref('')
let abortController: AbortController | null = null
const loadActions = async () => {
    if (abortController) {
        abortController.abort()
    }

    abortController = new AbortController()
    loading.value = true;
    try {
        const params = PaginationParamsFactory.createAction({
            page: pagination.page,
            limit: pagination.limit,
            sortBy: 'createdAt',
            sortOrder: 'ASC',
            ...searchParams
        })

        const response = await actionService.getList(params, { signal: abortController.signal });
        if (response.success) {
            actions.value = response.data
            Object.assign(pagination, (response as ApiPaginationResponse<Action[]>).pagination)
        } else {
            toast.add({
                severity: "error",
                summary: 'Ошибка',
                detail: response.message,
                life: 3000
            })
        }
    } catch {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить действия",
            life: 3000
        })
    }
    finally {
        loading.value = false;
    }
}
const loadDevices = async () => {
    loading.value = true;
    try {
        const response = await deviceService.getList();
        if (response.success) {
            devices.value = response.data
        } else {
            toast.add({
                severity: "error",
                summary: 'Ошибка',
                detail: response.message,
                life: 3000
            })
        }
    } catch {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить устройства",
            life: 3000
        })
    }
    finally {
        loading.value = false;
    }
}

const updateSearch = debounce((value: string) => {
    searchParams.search = value || undefined
    pagination.page = 1;
    loadActions()
}, 500)

const resetFilter = function () {
    Object.keys(tempFilters).forEach(key => {
        delete tempFilters[key as keyof ActionFilters]
    })
}

const applyFilters = function () {
    Object.assign(searchParams, tempFilters)
    showFilter.value = false
    pagination.page = 1;
    loadActions()
}

const addApplication = function () {
    router.push('/action/create');
}

const onPageChange = function (event: any) {
    pagination.page = event.page + 1
    loadActions()
}

const onHover = (hovered: boolean) => {
    if (!isExpanded.value) {
        isHovered.value = hovered
    }
}

const togglePanel = () => {
    isExpanded.value = !isExpanded.value
    if (!isExpanded.value) {
        isHovered.value = false
    }
}

const hasActiveFilters = computed(() => {
    return Object.keys(tempFilters).some(x => tempFilters[x as keyof ActionFilters])
})

const deviceOptions = computed(() => [
    { value: undefined, label: 'Все устройства' },
    ...(devices.value?.map(x => x.selectOption) || [])
])

const localMethodOptions = [
    { value: undefined, label: 'Все методы' },
    ...methodOptions
]

const checkboxOptions = [
    { value: undefined, label: 'Не выбрано' },
    { value: true, label: 'Да' },
    { value: false, label: 'Нет' },
]

watch(searchText, (newVal) => {
    updateSearch(newVal)
})

onMounted(() => {
    loadActions();
    loadDevices();
})

onUnmounted(() => {
    updateSearch.cancel()
})

</script>