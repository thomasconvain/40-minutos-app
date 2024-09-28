import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import SignIn from '@/views/SignIn.vue';
import SpectatorProfile from '@/views/SpectatorProfile.vue';
import EventDetail from '@/views/EventDetail.vue';
import CheckOut from '@/views/CheckOut.vue';
import CheckIn from '@/views/CheckIn.vue';
import ThankYouPage from '@/views/ThankYouPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/signin',
    name: 'SignIn',
    component: SignIn,
  },
  {
    path: '/profile/:idSpectator',
    name: 'Profile',
    component: SpectatorProfile,
  },
  {
    path: '/checkin/:idSpectator/:idEvent/:nameEvent?',
    name: 'CheckIn',
    component: CheckIn,
  },
  { path: '/event/:idSpectator/:idEvent/:nameEvent', 
    name: 'EventDetail', 
    component: EventDetail },
  {
    path: '/checkout/:idSpectator/:idEvent/:nameEvent?',
    name: 'CheckOut',
    component: CheckOut,
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

export default router;
