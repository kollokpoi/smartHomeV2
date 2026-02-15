<template>
  <div class="min-h-screen flex">
    <div class="flex w-full">
      <aside
        class="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:border-r lg:border-gray-200 bg-muted lg:sticky lg:top-0">
        <div class="flex flex-col h-full">
          <div class="shrink-0 p-6 border-b border-gray-200">
            <router-link to="/">
              <span class="text-xl font-bold text-gray-900">AdminPanel</span>
            </router-link>
          </div>

          <nav class="flex-1 overflow-y-auto py-4 px-4">
            <div class="space-y-1">
              <router-link v-for="item in navigation" :key="item.name" :to="item.to" :class="[
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium',
                isActive(item.to)
                  ? 'bg-primary-50 text-foreground-dark'
                  : 'text-foreground-light hover:bg-gray-100 hover:text-foreground-dark'
              ]">
                <component :is="item.icon" :class="[
                  'mr-3 h-5 w-5 shrink-0',
                  isActive(item.to) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                ]" />
                {{ item.name }}
              </router-link>
            </div>
          </nav>

          <div class="shrink-0 border-t border-gray-200 px-4 py-4">
            <div class="flex items-center">
              <div
                class="h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
       
              </div>
              <div class="ml-3">
                <ThemeSwitcher/>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <div class="lg:hidden">
          <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-gray-500 hover:text-gray-600">
              <Bars3Icon class="h-6 w-6" />
            </button>
            <router-link to="/" class="flex items-center space-x-2">
              <div
                class="h-8 w-8 rounded-lg bg-linear-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <span class="text-white font-bold text-sm">A</span>
              </div>
              <span class="text-lg font-bold text-gray-900">Admin</span>
            </router-link>
            <div class="h-8 w-8"></div>
          </div>

          <div v-if="mobileMenuOpen" class="bg-white shadow-lg">
            <div class="space-y-1 px-2 pb-3 pt-2">
              <router-link v-for="item in navigation" :key="item.name" :to="item.to" :class="[
                'block rounded-lg px-3 py-2 text-base font-medium',
                isActive(item.to)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              ]" @click="mobileMenuOpen = false">
                <div class="flex items-center">
                  <component :is="item.icon" :class="[
                    'mr-3 h-5 w-5',
                    isActive(item.to) ? 'text-primary-600' : 'text-gray-400'
                  ]" />
                  {{ item.name }}
                </div>
              </router-link>
            </div>
            <div class="border-t border-gray-200 px-4 py-3">
              <div class="flex items-center">
                <div
                  class="h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
      
                </div>
                
              </div>
            </div>
          </div>
        </div>

        <main class="w-full p-4 lg:p-6">
          <slot></slot>
        </main>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import {
  HomeIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CubeIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navigation = [
  { name: 'Дашборд', to: '/', icon: HomeIcon },
  { name: 'Девайсы', to: '/device', icon: BuildingOfficeIcon },
  { name: 'Действия', to: '/action', icon: DocumentTextIcon },
  { name: 'Параметры действия', to: '/action-parameter', icon: CreditCardIcon },
  { name: 'Голосовые команды', to: '/voice-command', icon: CubeIcon },
]

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