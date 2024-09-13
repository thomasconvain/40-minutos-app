import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import SpectatorProfile from '@/views/SpectatorProfile.vue';
import EventDetail from '@/views/EventDetail.vue';
import Checkout from '@/views/Checkout.vue';
import ThankYouPage from '@/views/ThankYouPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/profile/:id',
    name: 'Profile',
    component: SpectatorProfile,
  },
  { path: '/event/:idSpectator/:idEvent/:nameEvent', 
    name: 'EventDetail', 
    component: EventDetail },
  {
    path: '/checkout/:idSpectator/:idEvent/:nameEvent',
    name: 'Checkout',
    component: Checkout,
  },
  {
    path: '/thankyou',
    name: 'ThankYou',
    component: ThankYouPage,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  // Detectar si estamos refrescando la página después de la redirección de Mercado Pago
  const redirectedFromMercadoPago = sessionStorage.getItem('redirectedFromMercadoPago');

  // Si estamos refrescando después de la redirección
  if (redirectedFromMercadoPago && !from.name) {
    // Limpiamos la bandera de sessionStorage para evitar bucles
    sessionStorage.removeItem('redirectedFromMercadoPago');
    // Redirigir a la raíz
    next({ name: 'Home' });
  } else {
    // Continuar normalmente
    next();
  }
});

export default router;
