<!-- components/delayed/DelayDialog.vue -->
<template>
    <Dialog v-model:visible="localVisible" header="Отложенный вызов" modal class="w-96" :closable="false">
        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-sm font-medium mb-2">Задержка (секунды)</label>
                <div class="flex gap-2">
                    <InputNumber v-model="delaySeconds" :min="1" class="flex-1" placeholder="Введите задержку"
                        :invalid="!!validationError" />
                    <Button icon="pi pi-clock" @click="showPresets = !showPresets" text rounded severity="secondary" />
                </div>
                <small v-if="validationError" class="text-red-500">{{ validationError }}</small>
            </div>

            <div v-if="showPresets" class="grid grid-cols-3 gap-2">
                <Button label="1 мин" size="small" outlined @click="setDelay(60)" />
                <Button label="5 мин" size="small" outlined @click="setDelay(300)" />
                <Button label="10 мин" size="small" outlined @click="setDelay(600)" />
                <Button label="30 мин" size="small" outlined @click="setDelay(1800)" />
                <Button label="60 мин" size="small" outlined @click="setDelay(1800)" />
                <Button label="90 мин" size="small" outlined @click="setDelay(1800)" />
            </div>

            <div v-if="info" class="p-3 bg-blue-50 rounded-md text-sm">
                <p class="font-medium mb-1">Информация</p>
                <p>{{ info }}</p>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Отмена" @click="close" outlined />
                <Button label="Запланировать" severity="success" @click="confirm" :disabled="!isValid" />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
    visible: boolean;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', delay: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localVisible = ref(props.visible);
const delaySeconds = ref<number | null>(5);
const showPresets = ref(false);
const validationError = ref('');

const isValid = computed(() => {
    const delay = delaySeconds.value;
    if (!delay || delay < 1) {
        validationError.value = 'Задержка должна быть не менее 1 секунды';
        return false;
    }
    validationError.value = '';
    return true;
});

const info = computed(() => {
    if (!isValid.value || !delaySeconds.value) return '';
    const delayMs = delaySeconds.value * 1000;
    const scheduled = new Date(Date.now() + delayMs);
    const timeStr = scheduled.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let infoText = `Запланировано на ${timeStr}`;
    return infoText;
});

const setDelay = (seconds: number) => {
    delaySeconds.value = seconds;
    showPresets.value = false;
};

const confirm = () => {
    if (!isValid.value || !delaySeconds.value) return;
    emit('confirm', delaySeconds.value * 1000);
    close();
};

const close = () => {
    delaySeconds.value = 5;
    showPresets.value = false;
    validationError.value = '';
    emit('update:visible', false);
};

watch(() => props.visible, (newVal) => {
    localVisible.value = newVal;
    if (!newVal) {
        close();
    }
});

</script>