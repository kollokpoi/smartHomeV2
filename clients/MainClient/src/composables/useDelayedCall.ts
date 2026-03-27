// composables/useDelayedCall.ts
import { ref } from "vue";
import { useActionStore } from "@/stores/modules/action.store";
import { useToast } from "primevue";
import { ActionCallResult } from "@/types/api";

interface UseDelayedCallOptions {
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
}

export function useDelayedCall(options?: UseDelayedCallOptions) {
    const toast = useToast();
    const actionStore = useActionStore();
    
    const isDialogVisible = ref(false);
    const isUseDelay = ref(false);
    const pendingActionId = ref<string | null>(null);
    const callResponse = ref<ActionCallResult | null>(null)

    const executeImmediate = async (actionId: string) => {
        try {
            const result = await actionStore.callAction(actionId);
            callResponse.value = result
            if (result.success) {
                options?.onSuccess?.(result);
            } else {
                options?.onError?.(result.error);
            }
            return result;
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: 'Не удалось выполнить действие',
                life: 3000
            });
            options?.onError?.(error);
        }
    };

    const executeWithDelay = async (actionId: string, delayMs: number) => {
        try {
            const result = await actionStore.callAction(actionId, delayMs);
            callResponse.value = result
            if (result.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Запланировано',
                    detail: `Действие будет выполнено через ${delayMs / 1000} сек`,
                    life: 1500
                });
                options?.onSuccess?.(result);
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Ошибка',
                    detail: result.error?.message || 'Не удалось запланировать действие',
                    life: 1500
                });
                options?.onError?.(result.error);
            }
            return result;
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: 'Не удалось запланировать действие',
                life: 3000
            });
            options?.onError?.(error);
        }
    };

    const call = (actionId: string) => {
        pendingActionId.value = actionId;
        
        if (isUseDelay.value) {
            isDialogVisible.value = true;
        } else {
            executeImmediate(actionId);
        }
    };

    const confirmDelay = (delayMs: number) => {
        if (pendingActionId.value) {
            executeWithDelay(pendingActionId.value, delayMs);
        }
        isDialogVisible.value = false;
        pendingActionId.value = null;
    };

    const closeDialog = () => {
        isDialogVisible.value = false;
        pendingActionId.value = null;
    };

    return {
        isDialogVisible,
        isUseDelay,
        call,
        callResponse,
        confirmDelay,
        closeDialog
    };
}