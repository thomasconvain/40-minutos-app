import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import Themes from '@/views/Themes.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/themes',
    name: 'Temas',
    component: Themes,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
