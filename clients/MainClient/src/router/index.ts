import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Layout from '@/layouts/AppLayout.vue'


declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    subtitle?: string
    layout?: unknown
    roles?: string[]
  }
}

const NotFoundPage = () => import('@/views/NotFoundPage.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: {
      title: 'Страница не найдена',
      layout: Layout,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

router.onError((error) => {
  console.error('Router navigation error:', error)

  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Module load failed, try refreshing the page')
  }
})

export default router
