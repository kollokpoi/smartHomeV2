export interface DelayedTask {
    taskId: string;
    actionId: string;
    actionName: string;
    deviceId?: string;
    deviceName: string;
    deviceIp: string;
    startTime: number;
    delay: number;
    scheduledTime: string;
    remainingTime: number;
    request: {
        method: string;
        url: string;
        params: Record<string, any>;
        headers: Record<string, string>;
    };
}