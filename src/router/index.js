import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue'; // Ejemplo de componente para la ruta Home

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
