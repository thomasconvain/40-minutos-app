import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/tailwind.css';
import router from './router'; // Importa el router

const app = createApp(App);

app.use(router);

app.mount('#app');
