<template>
    <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2 text-font-primary">Действия</h1>
        <p class="text-font-secondary">Управление действиями</p>
    </div>

    <div class="flex w-full mb-3">
        <InputText class="flex-1 mr-2" placeholder="Поиск" v-model="searchText" />
        <Button label="Фильтры" icon="pi pi-filter" @click="showFilter = !showFilter" size="small"
            class=" text-xs md:text-normal" :badge="hasActiveFilters ? '!' : undefined"
            :severity="hasActiveFilters ? 'warning' : 'secondary'"
            :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
    </div>

    <div>
        <ActionTable :actions="actions" :loading="loading" @deleted="loadActions" v-memo="[actions.length, loading]" />
        <Paginator v-if="pagination.total > pagination.limit" :rows="pagination.limit" :totalRecords="pagination.total"
            @page="onPageChange" :first="(pagination.page - 1) * pagination.limit" />
    </div>
    <div class="fixed top-0 h-full z-50 pointer-events-none transition-all duration-300 ease-out" :class="[
        isExpanded ? 'right-0' :
            isHovered ? '-right-[calc(100%-2rem)] sm:-right-115' : '-right-[calc(100%-30px)] sm:-right-120'
    ]" @mouseenter="onHover(true)" @mouseleave="onHover(false)">

        <div class="relative h-full pointer-events-auto">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-48 bg-back-accent/70 rounded-l-lg shadow-lg cursor-pointer z-10"
                @click="togglePanel">
                <div class="h-full flex items-center justify-center">
                    <span class="transform -rotate-90 whitespace-nowrap text-font-primary font-medium text-sm">
                        {{ isExpanded ? 'Свернуть' : 'Панель действий' }}
                    </span>
                </div>
            </div>
            <div
                class="ml-8 w-[calc(100vw-2rem)] sm:w-120 max-w-125 h-full bg-back-secondary shadow-2xl overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl text-font-primary font-bold">Панель действий</h3>
                        <Button icon="pi pi-times" text rounded @click.stop="isExpanded = false" />
                    </div>
                    <div class="space-y-4 flex flex-col items-center gap-2">
                        <Button label="Создать новое" icon="pi pi-plus" severity="success" class="w-full"
                            @click="addApplication" />
                        <Button label="Статистика" icon="pi pi-chart-bar" class="w-full" @click="showStats" />
                        <Button label="К устройствам" icon="pi pi-server" severity="warn" class="w-full"
                            @click="goToDevices" />
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Dialog :visible="showFilter" class="w-6/7 lg:w-1/2" modal :closable="false" header="Фильтры" @hide="onDialogHide">
        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-sm font-medium mb-2">Устройство</label>
                <Select v-model="tempFilters.deviceId" :options="deviceStore.deviceOptions" class="w-full" filter
                    optionLabel="label" optionValue="value" placeholder="Все устройства"
                    :loading="deviceStore.loading" />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Метод</label>
                <Select v-model="tempFilters.method" :options="localMethodOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все методы">
                    <template #option="slotProps">
                        <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
                    </template>
                </Select>
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Время ожидания (мс)</label>
                <div class="flex w-full justify-between items-center flex-wrap">
                    <InputNumber placeholder="от" v-model="tempFilters.minTimeout" :min="0" />
                    <i class="pi pi-arrow-right mx-2"></i>
                    <InputNumber placeholder="до" v-model="tempFilters.maxTimeout" :min="0" />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Последний вызов</label>
                <div class="flex w-full justify-between items-center">
                    <DatePicker class="flex-1" placeholder="от" v-model="lastCallFromDate" />
                    <i class="pi pi-arrow-right mx-2"></i>
                    <DatePicker class="flex-1" placeholder="до" v-model="lastCallToDate" />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Минимум вызовов</label>
                <InputNumber class="w-full" placeholder="Минимум вызовов" v-model="tempFilters.minCallCount" :min="0" />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Есть ошибки</label>
                <Select v-model="tempFilters.hasError" :options="booleanOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Не выбрано" />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Активно</label>
                <Select v-model="tempFilters.isActive" :options="booleanOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Не выбрано" />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between w-full flex-col sm:flex-row gap-2">
                <Button label="Сбросить" icon="pi pi-filter-slash" @click="resetFilter" outlined severity="secondary" />
                <div class="flex gap-2 justify-between w-full sm:w-auto">
                    <Button label="Отмена" @click="showFilter = false" outlined />
                    <Button label="Применить" @click="applyFilters" icon="pi pi-check" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import ActionTable from '@/components/dataTables/ActionTable.vue';
import debounce from 'lodash/debounce';
import { ref, computed, onMounted, reactive, watch, onUnmounted } from 'vue';
import { useToast } from 'primevue';
import type { ActionFilters } from '@/types/searchParams';
import { useActionStore } from '@/stores/modules/action.store';
import router from '@/router';
import { httpMethodHelper } from '@/helpers/httpMethodHelper';
import { useDeviceStore } from '@/stores/modules/device.store';

const toast = useToast();
const actionStore = useActionStore();
const deviceStore = useDeviceStore()

const showFilter = ref(false);
const isExpanded = ref(false);
const isHovered = ref(false);
const searchText = ref('');

// Создаем локальную копию фильтров для диалога
const tempFilters = reactive<ActionFilters>({});

// Computed для дат
const lastCallFromDate = computed({
    get: () => tempFilters.lastCallFrom ? new Date(tempFilters.lastCallFrom) : undefined,
    set: (value: Date | undefined) => {
        tempFilters.lastCallFrom = value;
    }
});

const lastCallToDate = computed({
    get: () => tempFilters.lastCallTo ? new Date(tempFilters.lastCallTo) : undefined,
    set: (value: Date | undefined) => {
        tempFilters.lastCallTo = value;
    }
});

const actions = computed(() => actionStore.actions);
const loading = computed(() => actionStore.loading);
const pagination = computed(() => actionStore.pagination);
const storeFilters = computed(() => actionStore.filters);

const hasActiveFilters = computed(() => {
    return Object.keys(storeFilters.value).length > 0;
});

const localMethodOptions = [
    { value: undefined, label: 'Все методы' },
    ...httpMethodHelper.getSelectOptions()
];

const booleanOptions = [
    { value: undefined, label: 'Не выбрано' },
    { value: true, label: 'Да' },
    { value: false, label: 'Нет' },
];

const loadActions = async () => {
    try {
        await actionStore.fetchActions();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить действия",
            life: 3000
        });
    }
};

const loadDevices = async () => {
    try {
        await deviceStore.fetchDevices();
    } catch {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить устройства",
            life: 3000
        });
    }
};

// Debounced поиск
const updateSearch = debounce(async (value: string) => {
    actionStore.setFilters({ search: value || undefined });
    await loadActions();
}, 500);

// Обработчики фильтров
const applyFilters = async () => {
    actionStore.setFilters(tempFilters);
    showFilter.value = false;
    await loadActions();
};

const resetFilter = async () => {
    // Очищаем временные фильтры
    Object.keys(tempFilters).forEach(key => {
        delete tempFilters[key as keyof ActionFilters];
    });

    // Сбрасываем фильтры в сторе
    actionStore.resetFilters();
    showFilter.value = false;
    await loadActions();
};

const onPageChange = async (event: any) => {
    actionStore.pagination.page = event.page + 1;
    await loadActions();
};

const onDialogHide = () => {
    // При закрытии диалога без применения сбрасываем временные фильтры
    if (!showFilter.value) {
        Object.assign(tempFilters, storeFilters.value);
    }
};

// Навигация
const addApplication = () => {
    router.push('/action/create');
};

const showStats = () => {
    router.push('/action/stats');
};

const goToDevices = () => {
    router.push('/device');
};

// Обработчики панели
const onHover = (hovered: boolean) => {
    if (!isExpanded.value) {
        isHovered.value = hovered;
    }
};

const togglePanel = () => {
    isExpanded.value = !isExpanded.value;
    if (!isExpanded.value) {
        isHovered.value = false;
    }
};

// Watchers
watch(searchText, (newVal) => {
    updateSearch(newVal);
});

watch(showFilter, (newVal) => {
    if (newVal) {
        // При открытии копируем текущие фильтры из стора
        Object.assign(tempFilters, storeFilters.value);
    }
});

// Инициализация
onMounted(async () => {
    await Promise.all([
        loadActions(),
        loadDevices()
    ]);
});

// Очистка
onUnmounted(() => {
    updateSearch.cancel();
});
</script>