<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const themeStore = useThemeStore()
const {availableThemes } = storeToRefs(themeStore)

const menu = ref()
const menuItems = ref(availableThemes.value.map(theme => ({
  label: theme.charAt(0).toUpperCase() + theme.slice(1),
  icon: theme === 'light' ? 'pi pi-sun' :
        theme === 'dark' ? 'pi pi-moon' :
        theme === 'green' ? 'pi pi-leaf' :
        'pi pi-star',
  command: () => themeStore.setTheme(theme)
})))
</script>

<template>
  <div class="relative">
    <Button
      icon="pi pi-palette"
      severity="secondary"
      rounded
      aria-label="Темы"
      @click="menu.toggle($event)"
    />
    <Menu ref="menu" :model="menuItems" popup />
  </div>
</template>