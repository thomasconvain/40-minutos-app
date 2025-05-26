import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/tailwind.css';
import router from './router'; // Importa el router
import vPermission from './directives/vPermission';

const app = createApp(App);

app.use(router);
app.directive('permission', vPermission);

app.mount('#app');
