// stores/device.store.ts
import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import { deviceService } from "@/services/device.service";
import type { DeviceFilters } from "@/types/searchParams";
import { useEntityStore } from "../base/entity.store";
import type { Device, DeviceAttributes } from "@/types/dto";
import type {
  ApiPaginationResponse,
  ApiResponse,
  Pagination,
} from "@/types/api";

export const useDeviceStore = defineStore("device", () => {
  const entityStore = useEntityStore();

  const filters = ref<DeviceFilters>({});
  const pagination = reactive<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const totalDevices = computed<number>(() => pagination.total || 0);
  const currentListKey = computed(
    () =>
      `device:${JSON.stringify({ ...filters.value, page: pagination.page })}`,
  );

  const currentDevicesList = computed<Device[]>(() => {
    return entityStore.getList(currentListKey.value) || [];
  });

  const allDevices = computed<Device[]>(() => {
    return Object.values(entityStore.items).filter(
      (item): item is Device => item && item.__type === "device",
    );
  });

  const activeDevices = computed<Device[]>(() =>
    allDevices.value.filter((d) => d.isActive),
  );

  const onlineDevices = computed<Device[]>(() =>
    allDevices.value.filter((d) => d.status === "online"),
  );

  const deviceOptions = computed(() =>
    allDevices.value.map((d) => ({ value: d.id, label: d.name })),
  );

  const getDeviceById = (id: string): Device => entityStore.getItem(id);

  const fetchDevices = async (params?: any) => {
    entityStore.loading = true;
    entityStore.error = null;

    try {
      const response = await deviceService.getList({
        ...filters.value,
        ...pagination,
        ...params,
      });

      if (response.success) {
        response.data.forEach((device) => {
          entityStore.setItem(device.id, device);
        });

        entityStore.setList(currentListKey.value, response.data);

        Object.assign(
          pagination,
          (response as ApiPaginationResponse<Device[]>).pagination,
        );

        return response.data;
      }
    } catch (err: any) {
      entityStore.error = err.message;
    } finally {
      entityStore.loading = false;
    }
  };

  const fetchDeviceById = async (id: string, force = false) => {
    if (!force) {
      const cached = entityStore.getItem(id, { ttl: 5 * 60 * 1000 });
      if (cached) return cached;
    }

    entityStore.setItemLoading(id, true);

    try {
      const response = await deviceService.getDevice(id);
      if (response.success) {
        entityStore.setItem(id, response.data);
        return response.data;
      }
    } finally {
      entityStore.setItemLoading(id, false);
    }
  };

  const createDevice = async (
    data: DeviceAttributes,
    iconFile?: File,
  ): Promise<ApiResponse<Device>> => {
    try {
      const response = await deviceService.createDevice(data, iconFile);
      if (response.success) {
        entityStore.setItem(response.data.id, response.data);
        entityStore.invalidateListsByPrefix("device:");
      }
      return response;
    } catch (err: any) {
      entityStore.error = err.message;
      return {
        success: false,
        message: err.message,
      };
    }
  };

  const updateDevice = async (
    id: string,
    data: DeviceAttributes,
    iconFile?: File,
  ): Promise<ApiResponse<Device>> => {
    try {
      const response = await deviceService.updateDevice(id, data, iconFile);
      if (response.success) {
        entityStore.setItem(id, response.data);
        entityStore.invalidateListsByPrefix("device:");
      }
      return response;
    } catch (err: any) {
      entityStore.error = err.message;
      return {
        success: false,
        message: err.message,
      };
    }
  };

  const deleteDevice = async (
    id: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await deviceService.deleteDevice(id);
      if (response.success) {
        entityStore.clearItem(id);
        entityStore.invalidateListsByPrefix("device:");
        return {
          success: true,
          message: response.message || "Устройство успешно удалено",
        };
      } else {
        return {
          success: false,
          message: response.message || "Не удалось удалить устройство",
        };
      }
    } catch (err: any) {
      entityStore.error = err.message;
      return {
        success: false,
        message: err.message || "Ошибка при удалении",
      };
    }
  };

  const refreshCurrentList = async () => {
    return await fetchDevices();
  };

  // Метод для поиска устройств по критериям
  const findDevices = (criteria: Partial<Device>) => {
    return allDevices.value.filter((device) => {
      return Object.entries(criteria).every(
        ([key, value]) => device[key as keyof Device] === value,
      );
    });
  };

  const setFilters = (newFilters: Partial<DeviceFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    pagination.page = 1;
  };

  const resetFilters = () => {
    filters.value = {};
    pagination.page = 1;
  };

  return {
    filters,
    pagination,
    loading: computed(() => entityStore.loading),
    loadingItems: computed(() => entityStore.loadingItems),
    error: computed(() => entityStore.error),
    devices: currentDevicesList,

    allDevices,
    activeDevices,
    onlineDevices,
    deviceOptions,
    totalDevices,

    getDeviceById,
    findDevices,

    fetchDevices,
    fetchDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    refreshCurrentList,
    setFilters,
    resetFilters,
    clearCache: entityStore.clearCache,
  };
});
