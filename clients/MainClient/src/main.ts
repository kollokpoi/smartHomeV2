import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import PrimeVuePlugin from './plugins/primevue.js';
import { useNetworkStore } from './stores/modules/network.store'
import { useStreamStore } from './stores/modules/stream.store.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVuePlugin)
useNetworkStore().init()
useStreamStore().init()

app.mount('#app')