// stream.store.ts
import { defineStore } from "pinia";
import { useNetworkStore } from "./network.store";
import { computed, ref, watch } from "vue";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./auth.store";
import {
  DeviceConnectionAttributes,
  StreamData,
} from "@/types/dto/DeviceConnection.dto";

export const useStreamStore = defineStore("stream", () => {
  const networkStore = useNetworkStore();
  const authStore = useAuthStore();
  const streamUrl = computed(() => networkStore.streamUrl);

  const socket = ref<Socket | null>(null);
  const devices = ref<DeviceConnectionAttributes[]>([]);
  const deviceData = ref<Record<string, StreamData[]>>({});

  const getDeviceById = (id: string) => devices.value.find((d) => d.id === id);
  const deviceDataById = (id: string) => deviceData.value[id] || [];
  const isConnected = computed(() => !!socket.value?.connected);

  const init = () => {
    console.log("Connecting to:", streamUrl.value);

    socket.value = io(streamUrl.value, {
      transports: ["websocket", "polling"],
    });

    socket.value.on("connect", () => {
      socket.value!.emit("register-client", {
        clientId: authStore.user?.id,
        name: authStore.user?.name,
      });
    });

    socket.value.on(
      "devices-by-category",
      (data: DeviceConnectionAttributes[]) => {
        devices.value = data.map((d) => ({ ...d, data: [] }));
      },
    );

    socket.value.on("device-registered", (data: DeviceConnectionAttributes) => {
      devices.value.push(data);
    });

    socket.value.on("devices-commands", (data) => {
      console.log("Devices commands:", data);
    });

    // ВАЖНО: обработка бинарных данных
    socket.value.on("device-data", (data: StreamData | ArrayBuffer) => {
      if (data instanceof ArrayBuffer) {
        console.warn("Received raw buffer without deviceId");
        return;
      }

      const { deviceId, data: payload, timestamp } = data;

      if (!deviceId || !payload) {
        console.warn("Invalid device-data received:", { deviceId, hasPayload: !!payload });
        return;
      }

      if (!deviceData.value[deviceId]) {
        deviceData.value[deviceId] = [];
      }

      deviceData.value[deviceId].push({
        deviceId,
        data: payload,
        timestamp: timestamp || Date.now(),
      });

      // Ограничиваем буфер до 100 кадров на устройство для предотвращения утечек памяти
      if (deviceData.value[deviceId].length > 100) {
        deviceData.value[deviceId].shift();
      }

      const device = devices.value.find((d) => d.id === deviceId);
      if (device) {
        device.lastData = payload;
      }
    });

    socket.value.on("subscribed", (data) => {
      console.log("Subscribed:", data);
    });

    socket.value.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.value.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  };

  const disconnect = () => {
    if (!socket.value) return;
    socket.value.disconnect();
    socket.value = null;
  };

  const sendCommand = (deviceId: string, command: string, params?: any) => {
    if (!socket.value || !authStore.user) return;
    socket.value.emit("send-command", {
      deviceId,
      command,
      params,
      clientId: authStore.user.id,
    });
  };

  const unsubscribeDevices = (deviceIds: string[]) => {
    if (!socket.value || !authStore.user) return;
    socket.value.emit("unsubscribe-devices", {
      deviceIds,
      clientId: authStore.user.id,
    });
  };

  const subscribeDevices = (deviceIds: string[]) => {
    if (!socket.value || !authStore.user) return;
    socket.value.emit("subscribe-devices", {
      deviceIds,
      clientId: authStore.user.id,
    });
  };

  const subscribeByCategory = (categories: string[]) => {
    if (!socket.value || !authStore.user) return;
    socket.value.emit("subscribe-by-category", {
      categories,
      clientId: authStore.user.id,
    });
  };

  watch(streamUrl, (newVal) => {
    console.log(newVal);
    init();
  });

  return {
    getDeviceById,
    deviceDataById,
    isConnected,
    socket,
    init,
    subscribeDevices,
    unsubscribeDevices,
    subscribeByCategory,
    sendCommand,
    disconnect,
  };
});
