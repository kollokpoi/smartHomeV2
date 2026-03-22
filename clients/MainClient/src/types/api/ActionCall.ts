export interface ActionCallResult {
  success: boolean;
  data?: {
    action: {
      id: string;
      name: string;
    };
    device: {
      id: string;
      name: string;
      ip: string;
    };
    request: {
      method: string;
      url: string;
      params: any;
    };
    response: {
      status: number;
      data: any;
    };
  };
  error?: {
    message: string;
    status?: number;
  };
}