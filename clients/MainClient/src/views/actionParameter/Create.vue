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
            <Button @click="saveActionParameter" severity="success" :disabled="!isFormValid">Сохранить</Button>
        </div>

        <div class="w-full space-y-5">
            <CreateActionParameter v-for="(param, index) in items" :key="param.listIndex"
                :action-parameter="param.data" :validation-state="param.validationState"
                :block-extended="param.blockExtended" @update:expanded="(val) => setExpanded(param.id, val)"
                @update:validation-state="(result) => updateValidation(param.id, result)">
                <template v-slot:header>
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <p>{{ param.data.key || 'Новый параметр' }}</p>
                            <Badge v-if="!param.blockExtended" value="Свернуто" severity="secondary" size="small" />
                            <Badge v-if="hasErrors(param)" value="!" severity="danger" size="small" />
                        </div>

                        <Badge v-if="index > 0" value="Удалить" severity="danger" @click="removeItem(param.id)" />
                    </div>
                </template>
            </CreateActionParameter>

            <Button @click="addItem(actionId)" class="ml-auto">Добавить</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue';
import { useActionParameterStore } from '@/stores/modules/parameter.store';
import CreateActionParameter from '@/components/createElements/CreateActionParameter.vue';
import { useActionStore } from '@/stores/modules/action.store';
import { useRoute } from 'vue-router';
import { CONTENT_TYPE, PARAMETER_LOCATION, PARAMETER_TYPE } from '@/types/constants/parameterLocation';
import router from '@/router';
import { useBulkForm } from '@/composables/useBulkForm';
import type { ActionParameterAttributes } from '@/types/dto';

const toast = useToast();
const route = useRoute();
const actionParameterStore = useActionParameterStore();
const actionStore = useActionStore();

const actionId = ref<string>('');
const actionLoading = computed(() => actionStore.loading);

const action = computed(() => {
    const found = actionStore.getActionById(actionId.value);
    return found || null;
});

const {
    items,
    isFormValid,
    hasErrors,
    init,
    addItem,
    removeItem,
    updateValidation,
    setExpanded,
    save
} = useBulkForm(
    (id: string) => ({
        actionId: id,
        key: '',
        location: PARAMETER_LOCATION.query,
        value: '',
        type: PARAMETER_TYPE.string,
        required: false,
        contentType: CONTENT_TYPE.json,
        sortOrder: 0,
        isActive: true
    } as ActionParameterAttributes),
    async (data) => {
        return await actionParameterStore.bulkCreateActionParameter({
            actionId: actionId.value,
            parameters: data
        })
    }
)

const saveActionParameter = async () => {
    const result = await save()
    
    if (result?.success) {
        toast.add({
            severity: "success",
            summary: "Успешно",
            detail: "Параметры сохранены",
            life: 3000
        })
        router.back()
    } else if (result && !result.success && !result.bulkErrors) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: result.message || "Не удалось сохранить",
            life: 3000
        })
    }
}

onMounted(async () => {
    actionId.value = route.params.actionId as string;
    await actionStore.fetchActionById(actionId.value, true)
    init(actionId.value, 1);
});

</script>