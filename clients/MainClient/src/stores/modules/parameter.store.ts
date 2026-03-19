// stores/actionParameter.store.ts
import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import { actionParameterService } from "@/services/actionParameter.service";
import type {
  ApiPaginationResponse,
  ApiResponse,
  BulkActionParameterCreate,
  Pagination,
} from "@/types/api";
import type { ActionParameterFilters } from "@/types/searchParams";
import { useEntityStore } from "../base/entity.store";
import type { ActionParameter, ActionParameterAttributes } from "@/types/dto";

export const useActionParameterStore = defineStore("actionParameter", () => {
  const entityStore = useEntityStore();

  const filters = ref<ActionParameterFilters>({});
  const pagination = reactive<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const currentListKey = computed(
    () =>
      `actionParameter:${JSON.stringify({ ...filters.value, page: pagination.page })}`,
  );
  const totalActionParameters = computed<number>(() => pagination.total || 0)
  const actionParameters = computed<ActionParameter[]>(() => {
    return entityStore.getList(currentListKey.value) || [];
  });

  const allActionParameters = computed<ActionParameter[]>(() => {
    return Object.values(entityStore.items).filter(
      (item): item is ActionParameter =>
        item && item.__type === "actionParameter",
    );
  });

  const actionParameterOptions = computed(() =>
    allActionParameters.value.map(d => ({ value: d.id, label: d.key }))
  );

  const getParametersByAction = (actionId: string) =>
    computed(() =>
      allActionParameters.value.filter((a) => a.actionId === actionId),
    );

  const getActionParameterById = (id: string) => entityStore.getItem(id) as ActionParameter;

  const fetchActionParameters = async (params?: any) => {
    entityStore.loading = true;
    entityStore.error = null;

    try {
      const response = await actionParameterService.getList({
        ...filters.value,
        ...pagination,
        ...params,
      });

      if (response.success) {
        response.data.forEach((actionParameter) => {
          entityStore.setItem(actionParameter.id, {
            ...actionParameter,
            __type: "actionParameter",
          });
        });
        entityStore.setList(currentListKey.value, response.data);

        const responsePagination = (
          response as ApiPaginationResponse<ActionParameter[]>
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

  const fetchActionParameterById = async (id: string, force = false) => {
    if (!force) {
      const cached = entityStore.getItem(id, { ttl: 5 * 60 * 1000 });
      if (cached) return cached;
    }

    if (entityStore.setItemLoading) {
      entityStore.setItemLoading(id, true);
    }

    try {
      const response = await actionParameterService.getActionParameter(id);
      if (response.success) {
        entityStore.setItem(id, {
          ...response.data,
          __type: "actionParameter",
        });
        return response.data;
      }
    } finally {
      if (entityStore.setItemLoading) {
        entityStore.setItemLoading(id, false);
      }
    }
  };

  const updateActionParameter = async (
    id: string,
    data: ActionParameterAttributes,
  ): Promise<ApiResponse<ActionParameter>> => {
    try {
      const response = await actionParameterService.updateActionParameter(
        id,
        data,
      );
      if (response.success) {
        entityStore.setItem(id, {
          ...response.data,
          __type: "actionParameter",
        });
        entityStore.invalidateListsByPrefix("actionParameter:");
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

  const createActionParameter = async (
    data: ActionParameterAttributes,
  ): Promise<ApiResponse<ActionParameter>> => {
    try {
      const response = await actionParameterService.createActionParameter(data);
      if (response.success) {
        entityStore.setItem(response.data.id, {
          ...response.data,
          __type: "actionParameter",
        });
        entityStore.invalidateListsByPrefix("actionParameter:");
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

  const bulkCreateActionParameter = async (
    data: BulkActionParameterCreate,
  ): Promise<ApiResponse<ActionParameter[]>> => {
    try {
      const response =
        await actionParameterService.bulkCreateActionParameter(data);
      if (response.success) {
        response.data.forEach((actionParameter) => {
          entityStore.setItem(actionParameter.id, {
            ...actionParameter,
            __type: "actionParameter",
          });
        });
        entityStore.invalidateListsByPrefix("actionParameter:");
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

  const deleteActionParameter = async (
    id: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await actionParameterService.deleteActionParameter(id);
      if (response.success) {
        entityStore.clearItem(id);
        entityStore.invalidateListsByPrefix("actionParameter:");
        return {
          success: true,
          message: response.message || "Действие успешно удалено",
        };
      } else {
        return {
          success: false,
          message: response.message || "Не удалось удалить действие",
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
    actionParameters,
    allActionParameters,
    totalActionParameters,
    actionParameterOptions,
    
    loading: computed(() => entityStore.loading),
    error: computed(() => entityStore.error),
    getParametersByAction,
    getActionParameterById,
    fetchActionParameters,
    updateActionParameter,
    createActionParameter,
    fetchActionParameterById,
    deleteActionParameter,
    bulkCreateActionParameter,

    setFilters: (newFilters: Partial<ActionParameterFilters>) => {
      filters.value = { ...filters.value, ...newFilters };
      pagination.page = 1;
    },
    resetFilters: () => {
      filters.value = {};
      pagination.page = 1;
    },
  };
});
