export type Language = "ru-RU" | "en-US" | "uk-UA" | "tr-TR" | "kk-KZ"

export const LANGUAGES = {
  RU: 'ru-RU',
  EN: 'en-US',
  UK: 'uk-UA',
  TR: 'tr-TR',
  KK: 'kk-KZ',
} as const

export const LANGUAGES_ARRAY = Object.values(LANGUAGES)

export const LANGUAGE_LABELS: Record<Language, string> = {
  'ru-RU': 'Русский',
  'en-US': 'English',
  'uk-UA': 'Українська',
  'tr-TR': 'Türkçe',
  'kk-KZ': 'Қазақша',
}
export const LANGUAGE_FLAGS: Record<Language, string> = {
  'ru-RU': '🇷🇺',
  'en-US': '🇺🇸',
  'uk-UA': '🇺🇦',
  'tr-TR': '🇹🇷',
  'kk-KZ': '🇰🇿',
}