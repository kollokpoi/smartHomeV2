<!-- components/DeviceInterface.vue -->
<template>
  <div class="device-interface">
    <!-- Загрузка -->
    <div v-if="!device" class="loading">
      Загрузка устройства...
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <!-- Интерфейс в зависимости от категории -->
    <template v-else>
      <!-- Камера -->
      <CameraInterface 
        v-if="device.category === 'camera'"
        :device-id="deviceId"
        :device="device"
        @command="sendCommand"
      />
      
      <!-- Датчик -->
      <SensorInterface 
        v-else-if="device.category === 'sensor'"
        :device-id="deviceId"
        :device="device"
        :data="sensorData"
        @command="sendCommand"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStreamStore } from '@/stores/modules/stream.store';

import CameraInterface from './Camera.vue';
import SensorInterface from './Sensor.vue';
import LightInterface from './Light.vue'
import ActuatorInterface from './Controller.vue';

const props = defineProps<{
  deviceId: string
}>();

const streamStore = useStreamStore();
const error = ref<string | null>(null);

const device = computed(() => streamStore.getDeviceById(props.deviceId));
const deviceHistory = computed(() => streamStore.deviceDataById(props.deviceId));

const lastData = computed(() => {
  const history = deviceHistory.value;
  return history.length > 0 ? history[history.length - 1].data : null;
});

const sensorData = computed(() => {
  if (device.value?.category !== 'sensor') return null;
  return lastData.value;
});

const deviceData = computed(() => lastData.value);

const sendCommand = (command: string, params?: any) => {
  streamStore.sendCommand(props.deviceId, command, params);
};

onMounted(() => {
  if (device.value) {
    streamStore.subscribeDevices([props.deviceId]);
  }
});

// Проверяем существование устройства
watch(device, (dev) => {
  if (!dev) {
    error.value = `Устройство ${props.deviceId} не найдено`;
  } else {
    error.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
.device-interface {
  width: 100%;
  height: 100%;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
  color: #666;
}

.error {
  color: #f44336;
}
</style>