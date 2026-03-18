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
            <CreateActionParameter v-for="(param, index) in parameters" :key="param.listIndex"
                :action-parameter="param.actionParameter" :validation-state="param.validationState"
                :block-extended="param.blockExtended" @update:expanded="(val) => param.blockExtended = val"
                @update:validation-state="(val) => param.validationState = val">
                <template v-slot:header>
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                            <p>{{ param.actionParameter.key || 'Новый параметр' }}</p>
                            <Badge v-if="!param.blockExtended" value="Свернуто" severity="secondary" size="small" />
                            <Badge v-if="hasErrors(param)" value="!" severity="danger" size="small" />
                        </div>

                        <Badge v-if="index > 0" value="Удалить" severity="danger" @click="deleteBlock(index)" />
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
import CreateActionParameter from '@/components/createElements/CreateActionParameter.vue';
import { useActionStore } from '@/stores/modules/action.store';
import { useRoute } from 'vue-router';
import { CONTENT_TYPE, PARAMETER_LOCATION, PARAMETER_TYPE } from '@/types/constants/parameterLocation';
import type { ActionParameterCreateProps } from '@/types/props';
import type { BulkValidationError } from '@/types/api';
import router from '@/router';

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
const parameters = reactive<ActionParameterCreateProps[]>([])

const hasErrors = (param: ActionParameterCreateProps) => {
    return Object.values(param.validationState).some(v => !v.isValid);
};

const isFormValid = computed(() => {
    const res = parameters.every(param => {
        const hasValidationErrors = Object.values(param.validationState).some(v => !v.isValid);
        return !hasValidationErrors;
    });
    return res;
});

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

const deleteBlock = (index: number) => {
    if (parameters.length <= index) return
    parameters.splice(index, 1);

    parameters.forEach((param, idx) => {
        param.listIndex = idx;
    });
}

const saveActionParameter = async () => {
    if (!isFormValid.value) return;

    try {
        const response = await actionParameterStore.bulkCreateActionParameter({
            actionId: actionId.value,
            parameters: parameters.map(x => x.actionParameter)
        });

        if (response.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: "Параметры сохранены",
                life: 3000
            });
            router.back()
        } else {
            if (response.bulkErrors && response.bulkErrors.length > 0) {
                parameters.forEach(p => {
                    p.validationState = {};
                });

                response.bulkErrors.forEach((error: BulkValidationError) => {
                    const param = parameters[error.index];
                    if (param) {
                        error.errors.forEach(err => {
                            param.validationState[err.field] = {
                                isValid: false,
                                message: err.message,
                                fieldName: err.field
                            };
                        });
                        param.blockExtended = true;
                    }
                });

                toast.add({
                    severity: "error",
                    summary: "Ошибка валидации",
                    detail: "Проверьте правильность заполнения полей",
                    life: 3000
                });
            } else if (response.errors) {
                response.errors.forEach(err => {
                    if (parameters[0]) {
                        parameters[0].validationState[err.field] = {
                            isValid: false,
                            message: err.message,
                            fieldName: err.field
                        };
                    }
                });

                toast.add({
                    severity: "error",
                    summary: "Ошибка",
                    detail: response.message || "Ошибка валидации",
                    life: 3000
                });
            } else {
                toast.add({
                    severity: "error",
                    summary: "Ошибка",
                    detail: response.message || "Не удалось сохранить",
                    life: 3000
                });
            }
        }
    } catch (error) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось сохранить",
            life: 3000
        });
    }
};

onMounted(async () => {
    actionId.value = route.params.actionId as string;
    await actionStore.fetchActionById(actionId.value, true)
    pushNewItem()
});

</script>