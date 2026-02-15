import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import Layout from "@/layouts/AppLayout.vue";

const DeviceList = () => import("@/views/device/List.vue");
const DeviceDetail = () => import("@/views/device/List.vue");
const DeviceCreate = () => import("@/views/device/List.vue");

const ActionList = () => import("@/views/action/List.vue");
const ActionDetail = () => import("@/views/action/List.vue");
const ActionCreate = () => import("@/views/action/List.vue");

const ActionParameterList = () => import("@/views/actionParameter/List.vue");
const ActionParameterDetail = () => import("@/views/actionParameter/List.vue");
const ActionParameterCreate = () => import("@/views/actionParameter/List.vue");

const VoiceCommandList = () => import("@/views/voiceCommand/List.vue");
const VoiceCommandDetail = () => import("@/views/voiceCommand/List.vue");
const VoiceCommandCreate = () => import("@/views/voiceCommand/List.vue");

const Home = () => import("@/views/Home.vue");

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    title?: string;
    subtitle?: string;
    layout?: unknown;
    roles?: string[];
  }
}

const NotFoundPage = () => import("@/views/NotFoundPage.vue");

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: {
      title: "Домашняя",
      layout: Layout,
    },
  },
  {
    path: "/device",
    name: "devices",
    meta: {
      layout: Layout,
    },
    children: [
      {
        path: "",
        name: "DeviceList",
        component: DeviceList,
        meta: {
          title: "Список устройств",
          requiresAuth: false,
        },
      },
      {
        path: ":id",
        name: "DeviceDetail",
        component: DeviceDetail,
        meta: {
          title: "Устройство",
          requiresAuth: false,
        },
      },
      {
        path: "create",
        name: "DeviceCreate",
        component: DeviceCreate,
        meta: {
          title: "Создание устройств",
          requiresAuth: false,
        },
      },
    ],
  },
  {
    path: "/action",
    name: "actions",
    meta: {
      title: "Действия",
      requiresAuth: false,
      layout: Layout,
    },
    children: [
      {
        path: "",
        name: "ActionList",
        component: ActionList,
        meta: {
          title: "Список действий",
          requiresAuth: false,
        },
      },
      {
        path: ":id",
        name: "ActionDetail",
        component: ActionDetail,
        meta: {
          title: "Действие",
          requiresAuth: false,
        },
      },
      {
        path: "create",
        name: "ActionCreate",
        component: ActionCreate,
        meta: {
          title: "Создание действий",
          requiresAuth: false,
        },
      },
    ],
  },
  {
    path: "/action-parameter",
    name: "action-parameters",
    meta: {
      layout: Layout,
    },
    children: [
      {
        path: "",
        name: "ActionParameterList",
        component: ActionParameterList,
        meta: {
          title: "Список параметров",
          requiresAuth: false,
        },
      },
      {
        path: ":id",
        name: "ActionParameterDetail",
        component: ActionParameterDetail,
        meta: {
          title: "Параметр",
          requiresAuth: false,
        },
      },
      {
        path: "create",
        name: "ActionParameterCreate",
        component: ActionParameterCreate,
        meta: {
          title: "Создание параметров",
          requiresAuth: false,
        },
      },
    ],
  },
  {
    path: "/voice-command",
    name: "voiceCommand",
    meta: {
      layout: Layout,
    },
    children: [
      {
        path: "",
        name: "VoiceCommandList",
        component: VoiceCommandList,
        meta: {
          title: "Список команд",
          requiresAuth: false,
        },
      },
      {
        path: ":id",
        name: "VoiceCommandDetail",
        component: VoiceCommandDetail,
        meta: {
          title: "Команда",
          requiresAuth: false,
        },
      },
      {
        path: "create",
        name: "VoiceCommandCreate",
        component: VoiceCommandCreate,
        meta: {
          title: "Создание команда",
          requiresAuth: false,
        },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
    meta: {
      title: "Страница не найдена",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.afterEach((to) => {
  document.title = `Умный дом | ${to.meta.title || 'Главная'}`
})

router.onError((error) => {
  console.error("Router navigation error:", error);

  if (error.message.includes("Failed to fetch dynamically imported module")) {
    console.warn("Module load failed, try refreshing the page");
  }
});

export default router;
