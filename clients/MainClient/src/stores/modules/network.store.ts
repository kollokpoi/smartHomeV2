// stores/network.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNetworkStore = defineStore("network", () => {
  const isLocalNetwork = ref<boolean | null>(null);
  const isChecking = ref(false);

  const LOCAL_URL = import.meta.env.VITE_LOCAL_API_URL;
  const PUBLIC_URL = import.meta.env.VITE_PUBLIC_API_URL;
  const API_PORT = import.meta.env.VITE_API_PORT;
  const STREAM_PORT = import.meta.env.VITE_STREAM_PORT;

  const apiUrl = computed(() => {
    if (isLocalNetwork.value === true) return `${LOCAL_URL}:${API_PORT}/api`;
    if (isLocalNetwork.value === false) return `${PUBLIC_URL}/api`;
    return `${PUBLIC_URL}/api`;
  });

  const fileUrl = computed(() => {
    if (isLocalNetwork.value === true) return `${LOCAL_URL}:${API_PORT}`;
    if (isLocalNetwork.value === false) return PUBLIC_URL;
    return PUBLIC_URL; 
  });

  const streamUrl = computed(() => {
    if (isLocalNetwork.value === true) return `${LOCAL_URL}:${STREAM_PORT}`;
    if (isLocalNetwork.value === false) return `${PUBLIC_URL}/ws`;
    return `${PUBLIC_URL}/ws`; 
  });

  const checkLocalNetwork = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${LOCAL_URL}:${API_PORT}/api/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  const init = async () => {
    if (isChecking.value) return;
    isChecking.value = true;

    isLocalNetwork.value = await checkLocalNetwork();
    console.log(
      `🌐 Network mode: ${isLocalNetwork.value ? "LOCAL" : "PUBLIC"}`,
    );

    isChecking.value = false;
  };

  return {
    isLocalNetwork,
    isChecking,
    apiUrl,
    fileUrl,
    streamUrl,
    init,
    checkLocalNetwork,
  };
});
