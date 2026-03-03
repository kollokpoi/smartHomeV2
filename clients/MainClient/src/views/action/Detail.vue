<template>
    <div class="mb-6 border-b border-gray-200 pb-2 text-foreground-dark">
        <h1 class="text-2xl font-bold mb-2">Действия</h1>
        <p>Управление действиями</p>
    </div>
    <div class="w-full flex justify-center" v-if="loading">
        <ProgressSpinner />
    </div>
    <div class="w-full" v-else-if="action">
        <div class="flex w-full bg-background p-4 rounded-md gap-6">
            <div class="flex-1 flex flex-col gap-2">
                <div>
                    <dt class="text-sm text-foreground-dark ">Название</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.name" :maxLength="50" required
                        @edit-start="isEditing = true" />
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Путь</dt>
                    <EditableText :isEditing="isEditing" v-model="editData.path" :maxLength="150" required
                        @edit-start="isEditing = true" />
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Порт</dt>
                    <EditableNumber :isEditing="isEditing" v-model="editData.path" :maxLength="150" required
                        @edit-start="isEditing = true"/>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Метод</dt>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Описание</dt>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Таймаут</dt>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Сортировка</dt>
                </div>
            </div>
            <div class="flex-1 flex flex-col">
                <div>
                    <dt class="text-sm text-foreground-dark ">Последний вызов</dt>
                    <dd>{{ formatDate(action.lastCall) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Последний ответ</dt>
                    <dd>{{ action.lastResponse ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Последняя ошибка</dt>
                    <dd>{{ action.lastError ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-foreground-dark ">Метаданные</dt>
                    <pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{{
                        JSON.stringify(action.metadata, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>

    </div>

</template>
<script setup lang="ts">
import { actionService } from '@/services';
import { Action, type ActionAttributes } from '@/types/dto';
import { ref, onMounted, computed, useAttrs, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import EditableText from '@/components/editableFields/EditableText.vue';
import { formatDate } from '@/helpers/formatDate';
import EditableNumber from '@/components/editableFields/EditableNumber.vue';

const route = useRoute();
const toast = useToast();

const id = ref<string>('');
const action = ref<Action>();
const loading = ref<boolean>(false);

const isEditing = ref<boolean>(false);

const editData = reactive<ActionAttributes>({
    deviceId: '',
    name: '',
    path: '',
    port: 0
})

const getAction = async () => {
    try {
        loading.value = true;
        const response = await actionService.getAction(id.value)
        if (response.success) {
            action.value = response.data;
            Object.assign(editData, response.data)
        } else {
            toast.add({
                severity: "error",
                summary: "Ошибка получения действия",
                detail: response.message,
                life: 3000
            })
        }
    } catch {
        toast.add({
            severity: "error",
            summary: "Ошибка получения действия",
            detail: "Не удалось загрузить действие",
            life: 3000
        })
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    id.value = route.params.id as string;
    getAction();
})
</script>