// src/stores/themeStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark' | 'green' | 'purple'

export const useThemeStore = defineStore('theme', () => {
  // Доступные темы - делаем через ref!
  const availableThemes = ref<Theme[]>(['light', 'dark', 'green', 'purple'])
  
  // Текущая тема
  const currentTheme = ref<Theme>(
    (localStorage.getItem('theme') as Theme) || 'light'
  )

  // Установка темы
  const setTheme = (theme: Theme) => {
    if (!availableThemes.value.includes(theme)) return
    
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }

  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')
  const isGreen = computed(() => currentTheme.value === 'green')
  const isPurple = computed(() => currentTheme.value === 'purple')

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && availableThemes.value.includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      setTheme('light')
    }
  }

  return {
    availableThemes,   
    currentTheme,      
    isDark,            
    isLight,           
    isGreen,           
    isPurple,          
    setTheme,
    initTheme
  }
})