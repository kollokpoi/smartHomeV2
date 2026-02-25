<template>
    <ActionTable :actions="actions" :loading>

    </ActionTable>
</template>

<script setup lang="ts">
import ActionTable from '@/components/dataTables/ActionTable.vue';
import type { Action } from '@/types/dto';
import { ref, computed, onMounted, reactive } from 'vue';
import { useToast } from 'primevue';
import { actionService } from '@/services';
import type { ApiPaginationResponse } from '@/types/api';

const toast = useToast();
const loading = ref(false);

const actions = ref<Action[]>([])

const pagination = reactive({

})

const loadActions = async () => {
    loading.value = true;
    try {
        const response = await actionService.getList();
        if (response.success) {
            actions.value = response.data
            Object.assign(pagination, (response as ApiPaginationResponse<Action[]>).pagination)
        } else {
            toast.add({
                severity: "error",
                summary: 'Ошибка',
                detail: response.message,
                life: 3000
            })
        }
    } catch {
        toast.add({
            severity: "error",
            summary: 'Ошибка',
            detail: "Не удалось загрузить действия",
            life: 3000
        })
    }
    finally{
        loading.value = false;
    }
}

onMounted(() => {
    loadActions();
})

</script>
