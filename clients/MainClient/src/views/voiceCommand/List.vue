<template>
    <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">Голосовые команды</h1>
        <p class="text-gray-600">Управление командами действий</p>
    </div>

    <div class="flex w-full mb-3">
        <InputText class="flex-1 mr-2" placeholder="Поиск" v-model="searchText"/>
        <Button label="Фильтры" icon="pi pi-filter" @click="showFilter = !showFilter"
            :badge="hasActiveFilters ? '!' : undefined" :severity="hasActiveFilters ? 'warning' : 'secondary'"
            :badgeClass="hasActiveFilters ? 'p-badge-danger' : ''" />
    </div>

    <div class="flex relative">
        <div class="flex-1">
            <VoiceCommandTable :voiceCommands="voiceCommands" :loading @deleted="loadVoiceCommands"  v-memo="[voiceCommands]" />
            <Paginator v-if="pagination.total > pagination.limit" :rows="pagination.limit"
                :totalRecords="pagination.total" @page="onPageChange"
                :first="(pagination.page - 1) * pagination.limit" />
        </div>

        <!-- Боковая панель -->
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

                <div class="ml-8 w-120 h-full bg-muted shadow-2xl overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl text-foreground-dark font-bold">Панель действий</h3>
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
    </div>

    <Dialog :visible="showFilter" class="w-3/4 lg:w-1/2" modal :closable="false" header="Фильтры" @hide="onDialogHide">
        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-sm font-medium mb-2">Действие</label>
                <Select v-model="tempFilters.actionId" :options="actionStore.actionsOptions" class="w-full" filter
                    optionLabel="label" optionValue="value" placeholder="Все действия" :loading="actionsLoading"
                    showClear />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Локация</label>
                <Select v-model="tempFilters.language" :options="languageOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все языки" showClear>
                    <template #option="slotProps">
                        <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
                    </template>
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value" :severity="getLanguageSeverity(slotProps.value)"
                            :value="getLanguageLabel(slotProps.value)" />
                        <span v-else>Все языки</span>
                    </template>
                </Select>
            </div>

            <div>
                <label class="block text-sm font-medium mb-2">Активно</label>
                <Select v-model="tempFilters.isActive" :options="booleanOptions" class="w-full" optionLabel="label"
                    optionValue="value" placeholder="Все языки" showClear>
                    <template #option="slotProps">
                        <Tag :severity="slotProps.option.severity" :value="slotProps.option.label" />
                    </template>
                    <template #value="slotProps">
                        <Tag v-if="slotProps.value !== undefined" :severity="getActiveSeverity(slotProps.value)"
                            :value="getActiveLabel(slotProps.value)" />
                        <span v-else>Все</span>
                    </template>
                </Select>
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
import VoiceCommandTable from '@/components/dataTables/VoiceCommandTable.vue';
import debounce from 'lodash/debounce';
import { ref, computed, onMounted, reactive, watch, onUnmounted } from 'vue';
import { useToast } from 'primevue';
import type { VoiceCommandFilters } from '@/types/searchParams';
import { useVoiceCommandStore } from '@/stores/modules/voiceCommand.store';
import router from '@/router';
import { languageHelper } from '@/helpers/languageHelper';
import { useActionStore } from '@/stores/modules/action.store';
import { booleanOptions } from '@/types/constants';

const toast = useToast();
const voiceCommandStore = useVoiceCommandStore();
const actionStore = useActionStore();

const showFilter = ref(false);
const isExpanded = ref(false);
const isHovered = ref(false);
const searchText = ref('');

const tempFilters = reactive<VoiceCommandFilters>({});

const voiceCommands = computed(() => voiceCommandStore.voiceCommands);
const loading = computed(() => voiceCommandStore.loading);

const actionsLoading = computed(() => actionStore.loading);

const pagination = computed(() => voiceCommandStore.pagination);
const storeFilters = computed(() => voiceCommandStore.filters);

const hasActiveFilters = computed(() => {
    return Object.keys(storeFilters.value).length > 0;
});
const languageOptions = languageHelper.getSelectOptionsWithNull();

const getLanguageLabel = (value: string) => {
    const option = languageOptions.find(opt => opt.value === value);
    return option?.label || value;
};

const getLanguageSeverity = (value: string) => {
    const option = languageOptions.find(opt => opt.value === value);
    return option?.severity || 'info';
};

const getActiveLabel = (value: boolean) => {
    const option = booleanOptions.find(opt => opt.value === value);
    return option?.label || value;
};

const getActiveSeverity = (value: boolean) => {
    const option = booleanOptions.find(opt => opt.value === value);
    return option?.severity || 'info';
};

const loadVoiceCommands = async () => {
    try {
        await voiceCommandStore.fetchVoiceCommands();
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
    voiceCommandStore.setFilters({ search: value || undefined });
    await loadVoiceCommands();
}, 500);

const applyFilters = async () => {
    voiceCommandStore.setFilters(tempFilters);
    showFilter.value = false;
    await loadVoiceCommands();
};

const resetFilter = async () => {
    Object.keys(tempFilters).forEach(key => {
        delete tempFilters[key as keyof VoiceCommandFilters];
    });

    voiceCommandStore.resetFilters();
    showFilter.value = false;
    await loadVoiceCommands();
};

const onPageChange = async (event: any) => {
    voiceCommandStore.pagination.page = event.page + 1;
    await loadVoiceCommands();
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
        loadVoiceCommands(),
        loadActions()
    ]);
});

onUnmounted(() => {
    updateSearch.cancel();
});
</script>