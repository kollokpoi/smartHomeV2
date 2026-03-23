<template>
    <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2 text-font-primary">Устройства</h1>
        <p class="text-font-secondary">Управление устройствами</p>
    </div>

    <div class="flex w-full mb-3">
        <InputText class="flex-1 mr-2" placeholder="Поиск" v-model="searchText" />
        <Button label="Фильтры" icon="pi pi-filter" @click="showFilter = !showFilter" class="text-sm md:text-normal"
            :badge="hasActiveFilters ? '!' : undefined" :severity="hasActiveFilters ? 'warning' : 'secondary'"
            :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
    </div>

    <div class="flex relative">
        <div class="flex-1">
            <DeviceTable :devices="devices" :loading="loading" @deleted="loadDevices" />
            <Paginator v-if="pagination.total > pagination.limit" :rows="pagination.limit"
                :totalRecords="pagination.total" @page="onPageChange" />
        </div>

    </div>
    <div class="fixed top-0 h-full z-50 pointer-events-none transition-all duration-300 ease-out" :class="[
        isExpanded ? 'right-0' :
            isHovered ? '-right-115' : '-right-120'
    ]" @mouseenter="onHover(true)" @mouseleave="onHover(false)">

        <div class="relative h-full pointer-events-auto">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-48 bg-muted rounded-l-lg shadow-lg cursor-pointer z-10"
                @click="togglePanel">
                <div class="h-full flex items-center justify-center">
                    <span class="transform -rotate-90 whitespace-nowrap text-foreground-light font-medium text-sm">
                        {{ isExpanded ? 'Свернуть' : 'Панель действий' }}
                    </span>
                </div>
            </div>

            <div class="fixed top-0 h-full z-50 pointer-events-none transition-all duration-300 ease-out" :class="[
                isExpanded ? 'right-0' :
                    isHovered ? '-right-[calc(100%-2rem)] sm:-right-115' : '-right-[calc(100%-30px)] sm:-right-120'
            ]" @mouseenter="onHover(true)" @mouseleave="onHover(false)">

                <div class="relative h-full pointer-events-auto">
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-48 bg-back-accent/70 rounded-l-lg shadow-lg cursor-pointer z-10"
                        @click="togglePanel">
                        <div class="h-full flex items-center justify-center">
                            <span
                                class="transform -rotate-90 whitespace-nowrap text-font-primary font-medium text-sm">
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
                                    @click="goToCreateDevice" />
                                <Button label="Статистика" icon="pi pi-chart-bar" class="w-full" @click="showStats" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Диалог фильтров -->
    <Dialog :visible="showFilter" class="w-3/4 lg:w-1/2" modal :closable="false" header="Фильтры">
        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-sm font-medium mb-2">Статус</label>
                <Select v-model="tempFilters.status" :options="localStatusOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все методы" />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Последняя активность</label>
                <div class="flex w-full justify-between items-center">
                    <DatePicker class="flex-1" placeholder="от" v-model="lastSeenFromDate" />
                    <i class="pi pi-arrow-right mx-2"></i>
                    <DatePicker class="flex-1" placeholder="до" v-model="lastSeenToDate" />
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Адрес</label>
                <InputText class="w-full" placeholder="Адрес" v-model="tempFilters.ip" />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Активно</label>
                <Select v-model="tempFilters.isActive" :options="booleanOptions" class="w-full" optionLabel="label"
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
import DeviceTable from '@/components/dataTables/DeviceTable.vue';
import debounce from 'lodash/debounce';
import { ref, computed, onMounted, reactive, watch, onUnmounted } from 'vue';
import { DeviceStatusHelper } from '@/helpers/deviceStatusHelper';
import type { DeviceFilters } from '@/types/searchParams';
import { useDeviceStore } from '@/stores/modules/device.store';
import router from '@/router';

const deviceStore = useDeviceStore();

const showFilter = ref(false);
const isExpanded = ref(false);
const isHovered = ref(false);
const searchText = ref('');

const tempFilters = reactive<DeviceFilters>({});

const lastSeenFromDate = computed({
    get: () => tempFilters.minLastSeen ? new Date(tempFilters.minLastSeen) : undefined,
    set: (value: Date | undefined) => {
        tempFilters.minLastSeen = value;
    }
});

const lastSeenToDate = computed({
    get: () => tempFilters.maxLastSeen ? new Date(tempFilters.maxLastSeen) : undefined,
    set: (value: Date | undefined) => {
        tempFilters.maxLastSeen = value;
    }
});

const devices = computed(() => deviceStore.devices);
const loading = computed(() => deviceStore.loading);
const pagination = computed(() => deviceStore.pagination);
const hasActiveFilters = computed(() => {
    return Object.keys(deviceStore.filters).length > 0;
});

const localStatusOptions = [
    { value: undefined, label: 'Все методы' },
    ...DeviceStatusHelper.getSelectOptions()
];

const booleanOptions = [
    { value: undefined, label: 'Не выбрано' },
    { value: true, label: 'Да' },
    { value: false, label: 'Нет' },
];


const loadDevices = async () => {
    await deviceStore.fetchDevices({
        ...deviceStore.filters,
        search: searchText.value || undefined
    });
};

const updateSearch = debounce((value: string) => {
    deviceStore.setFilters({ search: value || undefined });
    loadDevices();
}, 500);

const applyFilters = () => {
    deviceStore.setFilters(tempFilters);
    showFilter.value = false;
    loadDevices();
};

const resetFilter = () => {
    Object.keys(tempFilters).forEach(key => {
        delete tempFilters[key as keyof DeviceFilters];
    });
    deviceStore.resetFilters();
    showFilter.value = false;
    loadDevices();
};

const onPageChange = (event: any) => {
    deviceStore.pagination.page = event.page + 1;
    loadDevices();
};

const goToCreateDevice = () => {
    router.push('/device/create');
};

const showStats = () => {
    router.push('/device/stats');
};

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

watch(searchText, updateSearch)

watch(showFilter, (newVal) => {
    if (newVal) {
        Object.assign(tempFilters, deviceStore.filters);
    }
});

onMounted(async () => {
    await loadDevices();
});

onUnmounted(() => {
    updateSearch.cancel();
});
</script>