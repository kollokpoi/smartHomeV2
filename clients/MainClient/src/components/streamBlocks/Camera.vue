<template>
    <div class="w-full bg-back-secondary rounded-lg flex justify-center p-2"
        :class="fullWindowMode ? 'fixed inset-0 z-50 p-6  h-screen' : ''">
        <div v-if="currentFrame" class="w-full">
            <img :src="currentFrame" alt="Camera stream" @click="openFull" class="w-full max-h-180"
                :class="fullWindowMode ? 'cursor-zoom-out' : 'cursor-zoom-in'" />
            <template v-if="fullWindowMode">
                <div class="w-full flex gap-3 overflow-x-auto mt-3">
                    <img v-for="(frame, index) in oldFrames" :key="index" :src="frame" alt="Camera stream"
                        class="max-h-50 w-30 block cursor-zoom-in" @click="openStoryItem(frame)" />
                </div>
                <div class="flex gap-2 mt-3 justify-center">
                    <Button icon="pi pi-times" severity="danger" @click="closeFull" />
                    <Button :icon="stopped ? 'pi pi-play' : 'pi pi-pause'" :severity="stopped ? 'secondary' : 'success'"
                        @click="pauseStream" />
                </div>
            </template>


        </div>
        <div v-else>
            Ожидание видеопотока...
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useStreamStore } from '@/stores/modules/stream.store';

const props = defineProps<{
    deviceId: string;
    device: any;
}>();

const streamStore = useStreamStore();
const currentFrame = ref<string | null>(null);
const oldFrames = ref<string[]>([]);
const fullWindowMode = ref(false);
const stopped = ref(false);
const rotation = ref(0);

const deviceHistory = computed(() => streamStore.deviceDataById(props.deviceId));
const lastFrame = computed(() => {
    if (!stopped.value) {
        const history = deviceHistory.value;
        if (history.length === 0) return null;
        return history[history.length - 1];
    }
});

const pauseStream = () => {
    stopped.value = !stopped.value;
}

const openFull = () => {
    fullWindowMode.value = !fullWindowMode.value;
    rotation.value = 0;
};

const closeFull = () => {
    fullWindowMode.value = false;
    rotation.value = 0;
};

const openStoryItem = (frameUrl: string) => {
    currentFrame.value = frameUrl;
    stopped.value = true;
};

const saveToHistory = (blobUrl: string) => {
    // Создаем копию через fetch, чтобы сохранить независимый URL
    fetch(blobUrl)
        .then(res => res.blob())
        .then(blob => {
            const newUrl = URL.createObjectURL(blob);
            oldFrames.value.unshift(newUrl);

            // Очищаем старые URL
            if (oldFrames.value.length > 50) {
                const removed = oldFrames.value.pop();
                if (removed) URL.revokeObjectURL(removed);
            }
        });
};

watch(lastFrame, (frameData) => {
    if (!frameData) return;

    const imageBuffer = frameData.data.image;
    if (!imageBuffer) return;

    const bytes = new Uint8Array(imageBuffer);
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        const newUrl = URL.createObjectURL(blob);

        // Сохраняем текущий кадр в историю перед заменой
        if (currentFrame.value) {
            URL.revokeObjectURL(currentFrame.value);
        }

        currentFrame.value = newUrl;
    }
});

setInterval(() => {
    if (currentFrame.value) {
        saveToHistory(currentFrame.value);
    }
}, 1000);

onUnmounted(() => {
    if (currentFrame.value) {
        URL.revokeObjectURL(currentFrame.value);
    }
    // Очищаем все URL в истории
    oldFrames.value.forEach(url => URL.revokeObjectURL(url));


});
</script>