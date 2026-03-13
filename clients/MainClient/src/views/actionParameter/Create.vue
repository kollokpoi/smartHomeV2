<template>
    <div class="w-full flex justify-center" v-if="actionLoading">
        <ProgressSpinner />
    </div>
    <div v-else-if="action">
        <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
            <div class="text-foreground-dark">
                <h1 class="text-2xl font-bold mb-2">Параметры</h1>
                <p>Создание параметров для {{ action.name }}</p>
            </div>
            <Button @click="saveActionParameter" severity="success">Сохранить</Button>
        </div>

        <div class="w-full space-y-5">
            <CreateActionParameter v-for="(parameter, index) in parameters" :key="index" :action-parameter="parameter"
                :expanded="expandedStates[index]" @update:expanded="(val) => expandedStates[index] = val">
                <template v-slot:header>
                    <p>{{ parameter.key || 'Новый параметр' }}</p>
                    <Badge v-if="!expandedStates[index]" value="Свернуто" severity="secondary" size="small" />
                </template>
            </CreateActionParameter>

            <Button @click="pushNewItem" class="ml-auto">Добавить</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useToast } from 'primevue';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import type { ActionParameterAttributes } from '@/types/dto';
import CreateActionParameter from '@/components/createElements/CreateActionParameter.vue';
import { useActionStore } from '@/stores/modules/action.store';
import { useRoute } from 'vue-router';
import { CONTENT_TYPE, PARAMETER_LOCATION, PARAMETER_TYPE } from '@/types/constants/parameterLocation';

const toast = useToast();
const route = useRoute();
const actionParameterStore = useActionParameterStore();
const actionStore = useActionStore();

const actionId = ref<string>('');
const parameterLoading = computed(() => actionParameterStore.loading)
const actionLoading = computed(() => actionStore.loading);
const expandedStates = ref<boolean[]>([]);

const action = computed(() => {
    const found = actionStore.getActionById(actionId.value);
    return found || null;
});

const parameters = ref<ActionParameterAttributes[]>([])

const pushNewItem = () => {
    if (!actionId.value) return;
    parameters.value.push({
        actionId: actionId.value,
        key: '',
        location: PARAMETER_LOCATION.query,
        value: '',
        type: PARAMETER_TYPE.string,
        required: false,
        contentType: CONTENT_TYPE.json,
        sortOrder: 0,
        isActive: true
    })
    expandedStates.value.push(true);
}

const saveActionParameter = async () => {

};

const toggleExpand = (index: number) => {
    expandedStates.value[index] = !expandedStates.value[index];
};

onMounted(async () => {
    actionId.value = route.params.actionId as string;
    await actionStore.fetchActionById(actionId.value, true)
    pushNewItem()
});

</script>