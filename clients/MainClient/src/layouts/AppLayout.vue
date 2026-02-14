<template>
  <div class="min-h-screen bg-gray-50 flex">
    <slot></slot>
    <ToastPrime />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)


const isActive = (path: string) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}


watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>