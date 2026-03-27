<template>
    <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2 text-font-primary">Параметры действий</h1>
        <p class="text-font-secondary">Управление параметрами действий</p>
    </div>

    <div class="flex w-full mb-3 gap-2">
        <InputText class="flex-1" placeholder="Поиск" v-model="searchText" />
        <VoiceRecognitionTextButton @result="(r)=>searchText = r" label=""/>
        <Button label="Фильтры" icon="pi pi-filter" @click="showFilter = !showFilter" size="small" class=" text-xs md:text-normal"
            :badge="hasActiveFilters ? '!' : undefined" :severity="hasActiveFilters ? 'warning' : 'secondary'"
            :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
    </div>

    <div>
        <ActionParameterTable :actionParameters="actionParameters" :loading="loading" @deleted="loadActionParameters" />
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
            <div class="ml-8 w-[calc(100vw-2rem)] sm:w-120 max-w-125 h-full bg-back-secondary shadow-2xl overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl text-font-primary font-bold">Панель действий</h3>
                        <Button icon="pi pi-times" text rounded @click.stop="isExpanded = false" />
                    </div>
                    <div class="space-y-4 flex flex-col items-center gap-2">
                        <Button label="К действиям" icon="pi pi-list" class="w-full" @click="goToActions" />
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
                <label class="block text-sm font-medium mb-2">Действие</label>
                <Select v-model="tempFilters.actionId" :options="actionStore.actionsOptions" class="w-full" filter
                    optionLabel="label" optionValue="value" placeholder="Все действия" :loading="actionsLoading"
                    showClear />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Локация</label>
                <Select v-model="tempFilters.location" :options="locationOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все локации" showClear>
                    <template #option="slotProps">
                        <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
                    </template>
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value" :severity="getLocationSeverity(slotProps.value)"
                            :value="getLocationLabel(slotProps.value)" />
                        <span v-else>Все локации</span>
                    </template>
                </Select>
            </div>

            <!-- Тип параметра -->
            <div>
                <label class="block text-sm font-medium mb-2">Тип параметра</label>
                <Select v-model="tempFilters.type" :options="typeOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все типы" showClear>
                    <template #option="slotProps">
                        <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
                    </template>
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value" :severity="getTypeSeverity(slotProps.value)"
                            :value="getTypeLabel(slotProps.value)" />
                        <span v-else>Все типы</span>
                    </template>
                </Select>
            </div>

            <!-- Обязательность -->
            <div>
                <label class="block text-sm font-medium mb-2">Обязательный</label>
                <Select v-model="tempFilters.required" :options="booleanOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Не выбрано" showClear />
            </div>

            <!-- Content Type -->
            <div>
                <label class="block text-sm font-medium mb-2">Content Type</label>
                <Select v-model="tempFilters.contentType" :options="contentTypeOptions" class="w-full"
                    optionLabel="label" optionValue="value" placeholder="Все типы контента" showClear>
                    <template #option="slotProps">
                        <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
                    </template>
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value" :severity="getContentTypeSeverity(slotProps.value)"
                            :value="getContentTypeLabel(slotProps.value)" />
                        <span v-else>Все типы контента</span>
                    </template>
                </Select>
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
import ActionParameterTable from '@/components/dataTables/ActionParameterTable.vue';
import VoiceRecognitionTextButton from '@/components/VoiceRecognitionTextButton.vue';
import debounce from 'lodash/debounce';
import { ref, computed, onMounted, reactive, watch, onUnmounted } from 'vue';
import { useToast } from 'primevue';
import type { ActionParameterFilters } from '@/types/searchParams';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import router from '@/router';
import { ActionParameterHelper } from '@/helpers/actionParameterHelper';
import { useActionStore } from '@/stores/modules/action.store';
import { booleanOptions } from '@/types/constants';

const toast = useToast();
const actionParameterStore = useActionParameterStore();
const actionStore = useActionStore();

const showFilter = ref(false);
const isExpanded = ref(false);
const isHovered = ref(false);
const searchText = ref('');

const tempFilters = reactive<ActionParameterFilters>({});

const actionParameters = computed(() => actionParameterStore.actionParameters);
const loading = computed(() => actionParameterStore.loading);
const actionsLoading = computed(() => actionStore.loading);

const pagination = computed(() => actionParameterStore.pagination);
const storeFilters = computed(() => actionParameterStore.filters);

const hasActiveFilters = computed(() => {
    return Object.keys(storeFilters.value).length > 0;
});

const locationOptions = ActionParameterHelper.getLocationSelectOptions();
const typeOptions = ActionParameterHelper.getTypeSelectOptions();
const contentTypeOptions = ActionParameterHelper.getContentTypeSelectOptions();

const getLocationLabel = (value: string) => {
    const option = locationOptions.find(opt => opt.value === value);
    return option?.label || value;
};

const getLocationSeverity = (value: string) => {
    const option = locationOptions.find(opt => opt.value === value);
    return option?.severity || 'info';
};

const getTypeLabel = (value: string) => {
    const option = typeOptions.find(opt => opt.value === value);
    return option?.label || value;
};

const getTypeSeverity = (value: string) => {
    const option = typeOptions.find(opt => opt.value === value);
    return option?.severity || 'info';
};

const getContentTypeLabel = (value: string) => {
    const option = contentTypeOptions.find(opt => opt.value === value);
    return option?.label || value;
};

const getContentTypeSeverity = (value: string) => {
    const option = contentTypeOptions.find(opt => opt.value === value);
    return option?.severity || 'info';
};

const loadActionParameters = async () => {
    try {
        await actionParameterStore.fetchActionParameters();
    } catch (error) {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить параметры действий",
            life: 3000
        });
    }
};

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

const updateSearch = debounce(async (value: string) => {
    actionParameterStore.setFilters({ search: value || undefined });
    await loadActionParameters();
}, 500);

const applyFilters = async () => {
    actionParameterStore.setFilters(tempFilters);
    showFilter.value = false;
    await loadActionParameters();
};

const resetFilter = async () => {
    Object.keys(tempFilters).forEach(key => {
        delete tempFilters[key as keyof ActionParameterFilters];
    });

    actionParameterStore.resetFilters();
    showFilter.value = false;
    await loadActionParameters();
};

const onPageChange = async (event: any) => {
    actionParameterStore.pagination.page = event.page + 1;
    await loadActionParameters();
};

const onDialogHide = () => {
    if (!showFilter.value) {
        Object.assign(tempFilters, storeFilters.value);
    }
};

const goToActions = () => {
    router.push('/action');
};

const goToDevices = () => {
    router.push('/device');
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
        Object.assign(tempFilters, storeFilters.value);
    }
});

onMounted(async () => {
    await Promise.all([
        loadActionParameters(),
        loadActions()
    ]);
});

onUnmounted(() => {
    updateSearch.cancel();
});
</script>