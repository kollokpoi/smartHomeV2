import type { ActionParameterAttributes, VoiceCommandAttributes } from "../dto";

export interface BulkActionParameterCreate {
  actionId: string;
  parameters: ActionParameterAttributes[];
}

export interface BulkVoiceCommandCreate {
  actionId: string;
  commands: VoiceCommandAttributes[];
}
