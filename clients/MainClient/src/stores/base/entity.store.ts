// stores/base/entity.store.ts
import { defineStore } from "pinia";
import { ref } from "vue";

interface CacheOptions {
  ttl?: number;
  maxAge?: number;
}

interface EntityMetadata {
  type?: string;
  timestamp: number;
}

export const useEntityStore = defineStore("entity", () => {
  const items = ref<Record<string, any>>({});
  const lists = ref<Record<string, any[]>>({});
  const metadata = ref<Record<string, EntityMetadata>>({});

  const loading = ref(false);
  const loadingItems = ref<{ [key: string]: boolean }>({});
  const error = ref<string | null>(null);

  const isCacheValid = (key: string, ttl: number = 5 * 60 * 1000): boolean => {
    const meta = metadata.value[key];
    if (!meta) return false;
    return Date.now() - meta.timestamp < ttl;
  };

  const setItem = (id: string, data: any) => {
    items.value[id] = data;
    metadata.value[`item:${id}`] = {
      type: data.__type,
      timestamp: Date.now()
    };
  };

  const setList = (key: string, data: any[]) => {
    lists.value[key] = data;
    metadata.value[`list:${key}`] = {
      timestamp: Date.now()
    };
  };

  const getItem = (id: string, options?: CacheOptions) => {
    if (!items.value[id]) return null;
    if (options?.ttl && !isCacheValid(`item:${id}`, options.ttl)) {
      // Автоматическая очистка просроченного элемента
      delete items.value[id];
      delete metadata.value[`item:${id}`];
      return null;
    }
    return items.value[id];
  };

  const getList = (key: string, options?: CacheOptions) => {
    if (!lists.value[key]) return null;
    if (options?.ttl && !isCacheValid(`list:${key}`, options.ttl)) {
      // Автоматическая очистка просроченного списка
      delete lists.value[key];
      delete metadata.value[`list:${key}`];
      return null;
    }
    return lists.value[key];
  };

  // Получить все элементы определенного типа
  const getItemsByType = (type: string) => {
    return Object.entries(items.value)
      .filter(([_, item]) => item && item.__type === type)
      .reduce((acc, [id, item]) => ({ ...acc, [id]: item }), {});
  };

  const invalidateLists = () => {
    lists.value = {};
    Object.keys(metadata.value).forEach((key) => {
      if (key.startsWith("list:")) {
        delete metadata.value[key];
      }
    });
  };

  const invalidateListsByPrefix = (prefix: string) => {
    Object.keys(lists.value).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete lists.value[key];
      }
    });

    Object.keys(metadata.value).forEach((key) => {
      if (key.startsWith("list:") && key.includes(prefix)) {
        delete metadata.value[key];
      }
    });
  };

  const clearCache = () => {
    items.value = {};
    lists.value = {};
    metadata.value = {};
  };

  const clearItem = (id: string) => {
    delete items.value[id];
    delete metadata.value[`item:${id}`];
  };

  const setItemLoading = (id: string, isLoading: boolean) => {
    loadingItems.value[id] = isLoading;
  };

  // Очистка просроченных элементов
  const cleanExpired = (maxAge: number = 10 * 60 * 1000) => {
    const now = Date.now();
    
    Object.entries(metadata.value).forEach(([key, meta]) => {
      if (now - meta.timestamp > maxAge) {
        if (key.startsWith('item:')) {
          const id = key.replace('item:', '');
          delete items.value[id];
        } else if (key.startsWith('list:')) {
          const listKey = key.replace('list:', '');
          delete lists.value[listKey];
        }
        delete metadata.value[key];
      }
    });
  };

  return {
    items,
    lists,
    loading,
    loadingItems,
    error,

    isCacheValid,
    getItem,
    getList,
    getItemsByType,

    setItem,
    setList,
    clearCache,
    clearItem,
    setItemLoading,
    invalidateLists,
    invalidateListsByPrefix,
    cleanExpired,
  };
});