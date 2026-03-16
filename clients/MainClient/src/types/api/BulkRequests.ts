import type { ActionParameterAttributes } from "../dto";

export interface BulkActionParameterCreate {
  actionId: string;
  parameters: ActionParameterAttributes[];
}
