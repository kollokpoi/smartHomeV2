export * from './Action.dto'
export * from './ActionParameter.dto'
export * from './Device.dto'
export * from './VoiceCommand'

// types/common.ts
export interface BaseAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface Metadata {
  [key: string]: any
}