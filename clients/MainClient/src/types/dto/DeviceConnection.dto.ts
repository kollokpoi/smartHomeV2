import { DeviceCategory } from "../constants";

export interface DeviceConnectionAttributes {
  id: string;
  category: DeviceCategory;
  commands: string[];
  status: "online";
  lastSeen: Date;
  data: StreamData[];
  connectedAt?: Date;
  lastData?: any;
  lastDataTimestamp?: Date;
}

export interface StreamData {
  deviceId: string;
  data: any;
  timestamp: Date;
}
