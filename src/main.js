import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/tailwind.css';
import router from './router'; // Importa el router

createApp(App).use(router).mount('#app')
