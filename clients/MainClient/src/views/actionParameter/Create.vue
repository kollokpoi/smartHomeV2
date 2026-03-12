<template>
    <div class="mb-6 border-b border-gray-200 pb-2 flex w-full justify-between items-end">
        <div class="text-foreground-dark">
            <h1 class="text-2xl font-bold mb-2">Параметры</h1>
            <p>Создание параметров для {{ action.name }}</p>
        </div>
        <Button @click="saveActionParameter" :disabled="!isFormValid" severity="success">Сохранить</Button>
    </div>

    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>

    <div class="w-full">
        <CreateActionParameter v-for="parameter in parameters" v-model="parameter"/>
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

const toast = useToast();
const route = useRoute();
const actionParameterStore = useActionParameterStore();
const actionStore = useActionStore();

const id = ref<string>('');
const loading = computed(()=>actionParameterStore.loading || actionStore.loading);

const action = computed(() => {
    const found = actionStore.getActionById(id.value);
    return found || null;
});

const parameters = ref<ActionParameterAttributes[]>([])

const isFormValid = computed(() => {
    return Object.values(validationState.value).every(v => v.isValid);
});


const saveActionParameter = async () => {
    if (!isFormValid.value) return;

    try {
        const updatedActionParameter = await actionParameterStore.createActionParameter(editData);
        if (updatedActionParameter.success) {
            toast.add({
                severity: "success",
                summary: "Успешно",
                detail: "Действие обновлено",
                life: 3000
            });
        } else {
            let errorMessage = updatedActionParameter.message;
            if (updatedActionParameter.errors) {
                updatedActionParameter.errors.forEach(error => {
                    errorMessage += `\nПоле ${error.field}`
                    updateValidation({
                        isValid: false,
                        message: error.message,
                        fieldName: error.field
                    });
                });
            }
            toast.add({
                severity: "error",
                summary: "Ошибка",
                detail: errorMessage || "Не удалось сохранить",
                life: 3000
            })
        }
    } catch {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось сохранить",
            life: 3000
        });
    }
};

onMounted(() => {
    id.value = route.params.id as string;
});

</script>