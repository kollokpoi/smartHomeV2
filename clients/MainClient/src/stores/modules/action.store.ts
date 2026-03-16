// stores/action.store.ts
import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import { actionService } from "@/services/action.service";
import type {
  ApiPaginationResponse,
  ApiResponse,
  Pagination,
} from "@/types/api";
import type { ActionFilters } from "@/types/searchParams";
import { useEntityStore } from "../base/entity.store";
import type { Action, ActionAttributes } from "@/types/dto";

export const useActionStore = defineStore("action", () => {
  const entityStore = useEntityStore();

  const filters = ref<ActionFilters>({});
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
      `action:${JSON.stringify({ ...filters.value, page: pagination.page })}`,
  );

  const actions = computed<Action[]>(() => {
    return entityStore.getList(currentListKey.value) || [];
  });

  const allActions = computed<Action[]>(() => {
    return Object.values(entityStore.items).filter(
      (item): item is Action => item && item.__type === "action",
    );
  });

  const getActionsByDevice = (deviceId: string) =>
    computed(() => allActions.value.filter((a) => a.deviceId === deviceId));

  const getActionById = (id: string) => entityStore.getItem(id) as Action;

  const fetchActions = async (params?: any) => {
    entityStore.loading = true;
    entityStore.error = null;

    try {
      const response = await actionService.getList({
        ...filters.value,
        ...pagination,
        ...params,
      });

      if (response.success) {
        response.data.forEach((action) => {
          entityStore.setItem(action.id, { ...action, __type: "action" });
        });
        entityStore.setList(currentListKey.value, response.data);

        const responsePagination = (response as ApiPaginationResponse<Action[]>).pagination
        pagination.hasNext = responsePagination.hasNext
        pagination.hasPrev = responsePagination.hasPrev
        pagination.page = responsePagination.page
        pagination.total = responsePagination.total
        pagination.totalPages = responsePagination.totalPages

        return response.data;
      }
    } catch (err: any) {
      entityStore.error = err.message;
    } finally {
      entityStore.loading = false;
    }
  };

  const fetchActionById = async (id: string, force = false) => {
    if (!force) {
      const cached = entityStore.getItem(id, { ttl: 5 * 60 * 1000 });
      if (cached) return cached;
    }

    if (entityStore.setItemLoading) {
      entityStore.setItemLoading(id, true);
    }

    try {
      const response = await actionService.getAction(id);
      if (response.success) {
        entityStore.setItem(id, { ...response.data, __type: "action" });
        return response.data;
      }
    } finally {
      if (entityStore.setItemLoading) {
        entityStore.setItemLoading(id, false);
      }
    }
  };

  const callAction = async (id: string) => {
    try {
      const response = await actionService.callAction(id);
      if (response.success) {
        await fetchActionById(id, true);
        return response.data;
      }
    } catch (err: any) {
      entityStore.error = err.message;
    }
  };

  const updateAction = async (
    id: string,
    data: ActionAttributes,
  ): Promise<ApiResponse<Action>> => {
    try {
      const response = await actionService.updateAction(id, data);
      if (response.success) {
        entityStore.setItem(id, { ...response.data, __type: "action" });
        entityStore.invalidateListsByPrefix("action:");
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

  const createAction = async (
    data: ActionAttributes,
  ): Promise<ApiResponse<Action>> => {
    try {
      const response = await actionService.createAction(data);
      if (response.success) {

        entityStore.setItem(response.data.id, { ...response.data, __type: "action" });
        entityStore.invalidateListsByPrefix("action:");
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

  const deleteAction = async (
    id: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await actionService.deleteAction(id);
      if (response.success) {
        entityStore.clearItem(id);
        entityStore.invalidateListsByPrefix("action:");
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
    actions,
    allActions,
    loading: computed(() => entityStore.loading),
    error: computed(() => entityStore.error),
    getActionsByDevice,
    getActionById,
    fetchActions,
    updateAction,
    fetchActionById,
    callAction,
    deleteAction,
    createAction,

    setFilters: (newFilters: Partial<ActionFilters>) => {
      filters.value = { ...filters.value, ...newFilters };
      pagination.page = 1;
    },
    resetFilters: () => {
      filters.value = {};
      pagination.page = 1;
    },
  };
});
