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
            <Button @click="saveActionParameter" severity="success" :disabled="isFormValid">Сохранить</Button>
        </div>

        <div class="w-full space-y-5">
            <CreateActionParameter v-for="param in parameters" :key="param.listIndex"
                :action-parameter="param.actionParameter" :validation-state="param.validationState"
                :block-extended="param.blockExtended" @update:expanded="(val) => param.blockExtended = val"
                @update:validation-state="(val) => param.validationState = val">
                <template v-slot:header>
                    <div class="flex items-center gap-2">
                        <p>{{ param.actionParameter.key || 'Новый параметр' }}</p>
                        <Badge v-if="!param.blockExtended" value="Свернуто" severity="secondary" size="small" />
                        <Badge v-if="hasErrors(param)" value="!" severity="danger" size="small" />
                    </div>
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
import type { ActionParameterCreateProps } from '@/types/props';

const toast = useToast();
const route = useRoute();
const actionParameterStore = useActionParameterStore();
const actionStore = useActionStore();

const actionId = ref<string>('');
const parameterLoading = computed(() => actionParameterStore.loading)
const actionLoading = computed(() => actionStore.loading);

const action = computed(() => {
    const found = actionStore.getActionById(actionId.value);
    return found || null;
});

const hasErrors = (param: ActionParameterCreateProps) => {
    return Object.values(param.validationState).some(v => !v.isValid);
};

// Валидность всей формы
const isFormValid = computed(() => {
    const log = []
    const res = parameters.every(param => {
        const hasValidationErrors = Object.values(param.validationState).some(v => !v.isValid);
        log.push({
            hasValidationErrors,
            state:param.validationState
        })
        return !hasValidationErrors;
    });
    console.log(log)
    return res;
});

const parameters = reactive<ActionParameterCreateProps[]>([])

const pushNewItem = () => {
    if (!actionId.value) return;
    const newParam = {
        actionId: actionId.value,
        key: '',
        location: PARAMETER_LOCATION.query,
        value: '',
        type: PARAMETER_TYPE.string,
        required: false,
        contentType: CONTENT_TYPE.json,
        sortOrder: 0,
        isActive: true
    }
    parameters.push({
        listIndex: parameters.length ?? 0,
        validationState: {},
        actionParameter: newParam,
        blockExtended: true
    })
}

const saveActionParameter = async () => {

};

onMounted(async () => {
    actionId.value = route.params.actionId as string;
    await actionStore.fetchActionById(actionId.value, true)
    pushNewItem()
});

</script>