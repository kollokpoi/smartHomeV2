// helpers/httpMethodHelper.ts
import { LANGUAGE_LABELS, LANGUAGES_ARRAY } from "@/types/constants/languages";

export const languageHelper = {
  getSelectOptions: () =>
    LANGUAGES_ARRAY.map((language) => ({
      value: language,
      label: LANGUAGE_LABELS[language],
    })),

  getSelectOptionsWithNull: () => {
    return [
      { value: undefined, label: "Не выбран", severity: "secondary" },
      ...LANGUAGES_ARRAY.map((language) => ({
        value: language,
        label: LANGUAGE_LABELS[language],
        severity: "info",
      })),
    ];
  },
};
