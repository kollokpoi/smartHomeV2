<template>
    <div class="w-full rounded-md p-4 mt-4 bg-background flex flex-col gap-4">
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md">
            <dt class="text-sm font-medium text-red-700">Ошибка</dt>
            <dd class="text-sm text-red-600 mt-1">{{ error.message }}</dd>
            <dd v-if="error.status" class="text-xs text-red-500 mt-1">Статус: {{
                error.status }}</dd>
        </div>

        <div v-else class="grid grid-cols-2 gap-4">
            <div>
                <dt class="text-sm font-medium text-foreground-dark mb-2">Запрос</dt>
                <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">{{
                    JSON.stringify(data?.request, null, 2)
                }}</pre>
            </div>

            <div>
                <dt class="text-sm font-medium text-foreground-dark mb-2">Ответ</dt>
                <div>
                    <div class="text-xs text-gray-500 mb-1">Статус: {{ data?.response?.status }}</div>
                    <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">{{
                        JSON.stringify(data?.response?.data, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { ActionCallResult } from '@/types/api';

const props = defineProps<ActionCallResult>()

</script>
