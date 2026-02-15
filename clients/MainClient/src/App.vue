<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from './stores/themeStore'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <component :is="route.meta.layout || 'div'">
      <component :is="Component" />
    </component>
  </router-view>
</template>
