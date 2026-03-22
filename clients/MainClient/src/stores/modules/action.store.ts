// stores/action.store.ts
import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";
import { actionService } from "@/services/action.service";
import type {
  ActionCallResult,
  ApiPaginationResponse,
  ApiResponse,
  Pagination,
} from "@/types/api";
import type { ActionFilters } from "@/types/searchParams";
import { useEntityStore } from "../base/entity.store";
import type { Action, ActionAttributes } from "@/types/dto";
import { useNetworkStore } from "./network.store";
import { useActionParameterStore } from "./parameter.store";
import { useDeviceStore } from "./device.store";

export const useActionStore = defineStore("action", () => {
  const entityStore = useEntityStore();
  const networkStore = useNetworkStore();
  const actionParameterStore = useActionParameterStore();
  const deviceStore = useDeviceStore();
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
  const actionsOptions = computed(() =>
    allActions.value.map((d) => ({ value: d.id, label: d.name })),
  );
  const totalActions = computed<number>(() => pagination.total || 0);
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

        const responsePagination = (response as ApiPaginationResponse<Action[]>)
          .pagination;
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
        const actionData = response.data;
        if (!actionData.device && actionData.deviceId) {
          const device = await deviceStore.fetchDeviceById(actionData.deviceId);
          actionData.device = device;
        }
        entityStore.setItem(id, { ...actionData, __type: "action" });
        return actionData;
      }
    } finally {
      if (entityStore.setItemLoading) {
        entityStore.setItemLoading(id, false);
      }
    }
  };

  const callAction = async (id: string): Promise<ActionCallResult> => {
    try {
      if (networkStore.isLocalNetwork) {
        const result = await callDeviceDirectly(id);
        if (result.success) {
          await actionService.registerCall(id, {
            responseStatus: result.data?.response.status,
            errorMessage: undefined,
          });
        } else {
          await actionService.registerCall(id, {
            responseStatus: result.error?.status,
            errorMessage: result.error?.message,
          });
        }
        await fetchActionById(id, true);
        return result;
      }

      const response = await actionService.callAction(id);

      if (response.success) {
        await fetchActionById(id, true);
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: {
          message: response.message || "Ошибка вызова",
          status: response.statusCode,
        },
      };
    } catch (err: any) {
      await actionService.registerCall(id, {
        responseStatus: err.response?.status || 500,
        errorMessage: err.message,
      });

      return {
        success: false,
        error: {
          message: err.message || "Неизвестная ошибка",
          status: err.response?.status || 500,
        },
      };
    }
  };

  const callDeviceDirectly = async (
    actionId: string,
  ): Promise<ActionCallResult> => {
    try {
      let action = getActionById(actionId);
      if (!action) {
        await fetchActionById(actionId);
        action = getActionById(actionId);
      }

      if (!action) {
        return {
          success: false,
          error: {
            message: "Действие не найдено",
            status: 404,
          },
        };
      }

      let device = action.device;
      if (!device && action.deviceId) {
        device = await deviceStore.fetchDeviceById(action.deviceId);
      }

      if (!device) {
        return {
          success: false,
          error: {
            message: "Устройство не найдено",
            status: 404,
          },
        };
      }

      let parameters =
        actionParameterStore.getParametersByAction(actionId).value;
      if (!parameters || parameters.length === 0) {
        await actionParameterStore.fetchActionParameters({ actionId });
        parameters = actionParameterStore.getParametersByAction(actionId).value;
      }

      let url = `http://${device.ip}:${action.port}${action.path}`;

      const requestParams = {
        query: {} as Record<string, any>,
        headers: {} as Record<string, string>,
        body: null as any,
      };

      for (const param of parameters) {
        let value = param.getTypedValue();

        if (value !== null && value !== undefined) {
          switch (param.location) {
            case "query":
              requestParams.query[param.key] = value;
              break;
            case "headers":
              requestParams.headers[param.key] = String(value);
              break;
            case "body":
              if (!requestParams.body) {
                requestParams.body = {};
                if (param.contentType) {
                  requestParams.headers["Content-Type"] =
                    param.contentType === "json"
                      ? "application/json"
                      : param.contentType === "formdata"
                        ? "multipart/form-data"
                        : param.contentType === "x-www-form-urlencoded"
                          ? "application/x-www-form-urlencoded"
                          : "text/plain";
                }
              }
              requestParams.body[param.key] = value;
              break;
            case "path":
              url = url.replace(
                `:${param.key}`,
                encodeURIComponent(String(value)),
              );
              break;
          }
        }
      }

      const response = await fetch(url, {
        method: action.method,
        headers: requestParams.headers,
        body: requestParams.body
          ? JSON.stringify(requestParams.body)
          : undefined,
      });

      let responseData = null;
      let result: ActionCallResult;

      try {
        responseData = await response.json();
        result = {
          success: responseData?.success !== false,
          data: {
            action: { id: action.id, name: action.name },
            device: { id: device.id, name: device.name, ip: device.ip },
            request: { method: action.method, url, params: requestParams },
            response: { status: response.status, data: responseData },
          },
        };
      } catch (err) {
        result = {
          success: false,
          error: {
            message:
              err instanceof Error ? err.message : "Ошибка парсинга ответа",
            status: response.status,
          },
          data: {
            action: { id: action.id, name: action.name },
            device: { id: device.id, name: device.name, ip: device.ip },
            request: { method: action.method, url, params: requestParams },
            response: { status: response.status, data: null },
          },
        };
      }
      await fetchActionById(actionId, true);
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: {
          message: err.message || "Ошибка выполнения",
          status: 500,
        },
      };
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
        entityStore.setItem(response.data.id, {
          ...response.data,
          __type: "action",
        });
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
    actionsOptions,
    totalActions,
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
