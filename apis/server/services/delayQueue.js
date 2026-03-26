// services/delayQueue.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class DelayQueue {
    constructor() {
        this.delayedActions = new Map(); // actionId -> Array<DelayedTask>
    }

    add(actionId, action, device, request, delay) {
        const taskId = uuidv4();
        const startTime = Date.now();

        const timeout = setTimeout(async () => {
            try {
                const response = await axios(request);
                await action.registerCall(response.status);
                this.removeTask(actionId, taskId);
            } catch (error) {
                await action.registerCall(error.response?.status || 500, error.message);
                this.removeTask(actionId, taskId);
            }
        }, delay);

        const task = {
            taskId,
            actionId,
            actionName: action.name,
            deviceName: device.name,
            deviceId:device.id,
            deviceIp: device.ip,
            startTime,
            delay,
            scheduledTime: new Date(startTime + delay).toISOString(),
            remainingTime: delay,
            request: {
                method: request.method,
                url: request.url,
                params: request.params,
                headers: request.headers
            },
            timeout
        };

        // Добавляем задачу в массив
        if (!this.delayedActions.has(actionId)) {
            this.delayedActions.set(actionId, []);
        }
        this.delayedActions.get(actionId).push(task);

        // Обновляем remainingTime каждую секунду
        const interval = setInterval(() => {
            const tasks = this.delayedActions.get(actionId);
            if (tasks) {
                const task = tasks.find(t => t.taskId === taskId);
                if (task) {
                    task.remainingTime = Math.max(0, task.startTime + task.delay - Date.now());
                }
            }
            if (!tasks || !tasks.find(t => t.taskId === taskId)) {
                clearInterval(interval);
            }
        }, 1000);

        task.interval = interval;

        return task;
    }

    removeTask(actionId, taskId) {
        const tasks = this.delayedActions.get(actionId);
        if (tasks) {
            const index = tasks.findIndex(t => t.taskId === taskId);
            if (index !== -1) {
                clearTimeout(tasks[index].timeout);
                clearInterval(tasks[index].interval);
                tasks.splice(index, 1);
                if (tasks.length === 0) {
                    this.delayedActions.delete(actionId);
                }
                return true;
            }
        }
        return false;
    }

    cancel(taskId) {
        for (const [actionId, tasks] of this.delayedActions) {
            const index = tasks.findIndex(t => t.taskId === taskId);
            if (index !== -1) {
                clearTimeout(tasks[index].timeout);
                clearInterval(tasks[index].interval);
                tasks.splice(index, 1);
                if (tasks.length === 0) {
                    this.delayedActions.delete(actionId);
                }
                return true;
            }
        }
        return false;
    }

    cancelByActionId(actionId) {
        const tasks = this.delayedActions.get(actionId);
        if (tasks) {
            tasks.forEach(task => {
                clearTimeout(task.timeout);
                clearInterval(task.interval);
            });
            this.delayedActions.delete(actionId);
            return true;
        }
        return false;
    }

    getByDeviceId(deviceId) {
        const allTasks = [];
        for (const tasks of this.delayedActions.values()) {
            for (const task of tasks) {
                if (task.deviceId === deviceId) {
                    allTasks.push(this._sanitizeTask(task));
                }
            }
        }
        return allTasks;
    }

    getAll() {
        const allTasks = [];
        for (const tasks of this.delayedActions.values()) {
            allTasks.push(...tasks.map(task => this._sanitizeTask(task)));
        }
        return allTasks;
    }

    getByActionId(actionId) {
        const tasks = this.delayedActions.get(actionId) || [];
        return tasks.map(task => this._sanitizeTask(task));
    }

    getByTaskId(taskId) {
        for (const tasks of this.delayedActions.values()) {
            const task = tasks.find(t => t.taskId === taskId);
            if (task) {
                return this._sanitizeTask(task);
            }
        }
        return null;
    }

    clear() {
        for (const tasks of this.delayedActions.values()) {
            tasks.forEach(task => {
                clearTimeout(task.timeout);
                clearInterval(task.interval);
            });
        }
        this.delayedActions.clear();
    }
    _sanitizeTask(task) {
        return {
            taskId: task.taskId,
            actionId: task.actionId,
            actionName: task.actionName,
            deviceId: task.deviceId,
            deviceName: task.deviceName,
            deviceIp: task.deviceIp,
            startTime: task.startTime,
            delay: task.delay,
            scheduledTime: task.scheduledTime,
            remainingTime: task.remainingTime,
            request: {
                method: task.request.method,
                url: task.request.url,
                params: task.request.params,
                headers: task.request.headers
            }
        };
    }
}

const delayQueue = new DelayQueue();
module.exports = { delayQueue };