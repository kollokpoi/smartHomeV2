import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import { voiceCommandService } from "@/services";
import type {
  ApiPaginationResponse,
  ApiResponse,
  BulkVoiceCommandCreate,
  Pagination,
} from "@/types/api";
import type { VoiceCommandFilters } from "@/types/searchParams";
import { useEntityStore } from "../base/entity.store";
import type { VoiceCommand, VoiceCommandAttributes } from "@/types/dto";

export const useVoiceCommandStore = defineStore("voiceCommand", () => {
  const entityStore = useEntityStore();

  const filters = ref<VoiceCommandFilters>({});
  const pagination = reactive<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const currentListKey = computed(
    () =>
      `voiceCommand:${JSON.stringify({ ...filters.value, page: pagination.page })}`,
  );
  const totalVoiceCommands = computed<number>(() => pagination.total || 0)
  const voiceCommands = computed<VoiceCommand[]>(() => {
    return entityStore.getList(currentListKey.value) || [];
  });

  const allVoiceCommands = computed<VoiceCommand[]>(() => {
    return Object.values(entityStore.items).filter(
      (item): item is VoiceCommand =>
        item && item.__type === "voiceCommand",
    );
  });

  const voiceCommandOptions = computed(() =>
    allVoiceCommands.value.map(d => ({ value: d.id, label: d.command }))
  );

  const getVoiceCommandsByAction = (actionId: string) =>
    computed(() =>
      allVoiceCommands.value.filter((a) => a.actionId === actionId),
    );

  const getVoiceCommandById = (id: string) => entityStore.getItem(id) as VoiceCommand;

  const fetchVoiceCommands = async (params?: any) => {
    entityStore.loading = true;
    entityStore.error = null;

    try {
      const response = await voiceCommandService.getList({
        ...filters.value,
        ...pagination,
        ...params,
      });

      if (response.success) {
        response.data.forEach((voiceCommand) => {
          entityStore.setItem(voiceCommand.id, {
            ...voiceCommand,
            __type: "voiceCommand",
          });
        });
        entityStore.setList(currentListKey.value, response.data);

        const responsePagination = (
          response as ApiPaginationResponse<VoiceCommand[]>
        ).pagination;
        pagination.hasNext = responsePagination.hasNext;
        pagination.hasPrev = responsePagination.hasPrev;
        pagination.page = responsePagination.page;
        pagination.total = responsePagination.total;
        pagination.totalPages = responsePagination.totalPages;

        return response.data;
      }
    } catch (err: any) {
      entityStore.error = err.message;
    } finally {
      entityStore.loading = false;
    }
  };

  const fetchVoiceCommandById = async (id: string, force = false) => {
    if (!force) {
      const cached = entityStore.getItem(id, { ttl: 5 * 60 * 1000 });
      if (cached) return cached;
    }

    if (entityStore.setItemLoading) {
      entityStore.setItemLoading(id, true);
    }

    try {
      const response = await voiceCommandService.getVoiceCommand(id);
      if (response.success) {
        entityStore.setItem(id, {
          ...response.data,
          __type: "voiceCommand",
        });
        return response.data;
      }
    } finally {
      if (entityStore.setItemLoading) {
        entityStore.setItemLoading(id, false);
      }
    }
  };

  const updateVoiceCommand = async (
    id: string,
    data: VoiceCommandAttributes,
  ): Promise<ApiResponse<VoiceCommand>> => {
    try {
      const response = await voiceCommandService.updateVoiceCommand(
        id,
        data,
      );
      if (response.success) {
        entityStore.setItem(id, {
          ...response.data,
          __type: "voiceCommand",
        });
        entityStore.invalidateListsByPrefix("voiceCommand:");
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

  const createVoiceCommand = async (
    data: VoiceCommandAttributes,
  ): Promise<ApiResponse<VoiceCommand>> => {
    try {
      const response = await voiceCommandService.createVoiceCommand(data);
      if (response.success) {
        entityStore.setItem(response.data.id, {
          ...response.data,
          __type: "voiceCommand",
        });
        entityStore.invalidateListsByPrefix("voiceCommand:");
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

  const bulkCreateVoiceCommand = async (
    data: BulkVoiceCommandCreate,
  ): Promise<ApiResponse<VoiceCommand[]>> => {
    try {
      const response =
        await voiceCommandService.bulkCreateVoiceCommand(data);
      if (response.success) {
        response.data.forEach((voiceCommand) => {
          entityStore.setItem(voiceCommand.id, {
            ...voiceCommand,
            __type: "voiceCommand",
          });
        });
        entityStore.invalidateListsByPrefix("voiceCommand:");
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

  const deleteVoiceCommand = async (
    id: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await voiceCommandService.deleteVoiceCommand(id);
      if (response.success) {
        entityStore.clearItem(id);
        entityStore.invalidateListsByPrefix("voiceCommand:");
        return {
          success: true,
          message: response.message || "Команда успешно удалена",
        };
      } else {
        return {
          success: false,
          message: response.message || "Не удалось удалить команду",
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

  return {
    filters,
    pagination,
    voiceCommands,
    allVoiceCommands,
    totalVoiceCommands,
    voiceCommandOptions,
    loading: computed(() => entityStore.loading),
    error: computed(() => entityStore.error),
    getVoiceCommandsByAction,
    getVoiceCommandById,
    fetchVoiceCommands,
    updateVoiceCommand,
    createVoiceCommand,
    fetchVoiceCommandById,
    deleteVoiceCommand,
    bulkCreateVoiceCommand,

    setFilters: (newFilters: Partial<VoiceCommandFilters>) => {
      filters.value = { ...filters.value, ...newFilters };
      pagination.page = 1;
    },
    resetFilters: () => {
      filters.value = {};
      pagination.page = 1;
    },
  };
});
