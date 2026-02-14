import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import PrimeVuePlugin from './plugins/primevue.js';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVuePlugin)

app.mount('#app')