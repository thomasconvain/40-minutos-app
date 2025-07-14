<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <div class="flex flex-row items-center justify-between mb-10">
      <img src="../assets/logo_horizontal.png" width="150" />
      <router-link to="/login" class="btn bg-white border-none" title="Iniciar sesión">
        <ArrowRightOnRectangleIcon class="h-5 w-5" />
      </router-link>
    </div>
    <h1 class="justify-self-start text-2xl text-gray-900 font-bold">Inscríbete a nuestro próximos eventos</h1>
    <ActiveEvents />
  </div>
</template>

<script setup>
import ActiveEvents from "@/components/ActiveEvents.vue";
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';
</script>

<style scoped>

.responsive-iframe {
  position: relative;
  width: 100%;
  padding-bottom: 80%; /* Relación de aspecto 4:5 */
  height: 0;
  overflow: hidden;
}

.responsive-iframe iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  /* Asegura que el contenido siempre esté centrado */
  object-fit: cover;
}

@media (max-width: 767px) {
  .responsive-iframe {
    padding-bottom: 145%; /* Relación de aspecto 4:5 */
  }
}
</style>
