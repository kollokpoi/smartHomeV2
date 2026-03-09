import type { EditableField } from "./base.editableFields";

export interface EditableSelect extends EditableField {
  modelValue: any | null;
  items: Array<{ label: string; value: any; severity?: string }>;
  filter?: boolean;
  optionLabel?: string;
  optionValue?: string;
}
