import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Home from '@/views/Home.vue';
import SignIn from '@/views/SignIn.vue';
import PasswordReset from '@/views/PasswordReset.vue';
import LogIn from '@/views/LogIn.vue';
import SpectatorProfile from '@/views/SpectatorProfile.vue';
import EventDetail from '@/views/EventDetail.vue';
import Checkout from '@/views/Checkout.vue';
import CheckIn from '@/views/CheckIn.vue';
import ThankYouPage from '@/views/ThankYouPage.vue';
import AdminPage from '@/views/AdminPage.vue';
import AdminLogin from '@/views/AdminLogin.vue';
import OnlineBooking from '@/views/OnlineBooking.vue';
import PasswordConfig from '@/views/PasswordConfig.vue';
import Dashboard from '@/views/Dashboard.vue';
import Assembly from '@/views/Assembly.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/assembly',
    name: 'Assembly',
    component: Assembly,
  },
  {
    path: '/sign-in/:idEvent?',
    name: 'SignIn',
    component: SignIn,
  },
  {
    path: '/booking/:idEvent?',
    name: 'Booking',
    component: OnlineBooking,
  },
  {
    path: '/password-reset/:email?',
    name: 'PasswordReset',
    component: PasswordReset,
  },
  {
    path: '/password-config/',
    name: 'PasswordConfig',
    component: PasswordConfig,
  },
  {
    path: '/login/:idEvent?',
    name: 'LogIn',
    component: LogIn,
  },
  {
    path: '/profile/:idSpectator',
    name: 'Profile',
    component: SpectatorProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/checkin/:idSpectator/:idEvent/:nameEvent?',
    name: 'CheckIn',
    component: CheckIn,
    meta: { requiresAuth: true }
  },
  {
    path: '/event/:idSpectator/:idEvent/:nameEvent?',
    name: 'EventDetail',
    component: EventDetail,
  },
  {
    path: '/checkout/:idSpectator/:idEvent/:nameEvent?',
    name: 'Checkout',
    component: Checkout,
    meta: { requiresAuth: true }
  },
  {
    path: '/thankyou',
    name: 'ThankYou',
    component: ThankYouPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/login',
    name: 'Login',
    component: AdminLogin,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Función auxiliar para obtener el usuario actual en forma de promesa
function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}

router.beforeEach(async (to, from, next) => {
  // Si se intenta acceder a la raíz '/'
  if (to.path === '/') {
    const user = await getCurrentUser();
    if (user) {
      // Redirigir a /profile/:idSpectator, usando el uid del usuario logueado
      next(`/profile/${user.uid}`);
    } else {
      next();
    }
  } else if (to.matched.some(record => record.meta.requiresAuth)) {
    // Para rutas que requieren autenticación
    const user = await getCurrentUser();
    if (user) {
      next();
    } else {
      next('/');
    }
  } else {
    next();
  }
});

export default router;
