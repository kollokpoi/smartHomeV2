export type ParameterLocation = "body" | "query" | "path" | "headers";
export type ParameterType = "string" | "number" | "boolean" | "json" | "array";
export type ContentType =
  "json"
  | "formdata"
  | "x-www-form-urlencoded"
  | "plain";

export const PARAMETER_LOCATION = {
  body: "body",
  query: "query",
  path: "path",
  headers: "headers",
} as const;
export const PARAMETER_TYPE = {
  string: "string",
  number: "number",
  boolean: "boolean",
  json: "json",
  array: "array",
} as const;
export const CONTENT_TYPE = {
  formdata: "formdata",
  "x-www-form-urlencoded": "x-www-form-urlencoded",
  plain: "plain",
  json: "json",
} as const;

export const PARAMETER_LOCATION_ARRAY = Object.values(PARAMETER_LOCATION);
export const PARAMETER_TYPE_ARRAY = Object.values(PARAMETER_TYPE);
export const CONTENT_TYPE_ARRAY = Object.values(CONTENT_TYPE);

export const PARAMETER_LOCATION_LABELS: Record<ParameterLocation, string> = {
  body: "Тело",
  query: "Запрос",
  path: "Путь",
  headers: "Заголовок",
};
export const PARAMETER_TYPE_LABELS: Record<ParameterType, string> = {
  string: "Строка",
  number: "Число",
  boolean: "Булево",
  json: "JSON",
  array: "Массив",
};
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  formdata: "Форма",
  "x-www-form-urlencoded": "x-www-form-urlencoded",
  plain: "Текст",
  json: "JSON",
};


export const PARAMETER_LOCATION_SEVERITY: Record<ParameterLocation, string> = {
  body: 'info',
  query: 'success',
  path: 'warning',
  headers: 'danger',
}
export const PARAMETER_TYPE_SEVERITY: Record<ParameterType, string> = {
  string: 'info',
  number: 'success',
  boolean: 'warning',
  json: 'danger',
  array: 'help',
}
export const CONTENT_TYPE_SEVERITY: Record<ContentType, string> = {
  json: 'info',
  formdata: 'success',
  'x-www-form-urlencoded': 'warning',
  plain: 'secondary'
}