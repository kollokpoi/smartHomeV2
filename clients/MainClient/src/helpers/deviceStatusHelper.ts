import { DEVICE_STATUSES_ARRAY, DEVICE_STATUSES_LABELS, DEVICE_STATUSES_SEVERITY } from '@/types/constants/'

export const DeviceStatusHelper = {
  getSelectOptions: () => 
    DEVICE_STATUSES_ARRAY.map(method => ({
      value: method,
      label: DEVICE_STATUSES_LABELS[method],
      severity: DEVICE_STATUSES_SEVERITY[method]
    })),
    
  getOptions: () =>
    DEVICE_STATUSES_ARRAY.map(method => ({
      value: method,
      label: method
    }))
}