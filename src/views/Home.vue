<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <div class="flex flex-col items-start mb-10">
      <img src="../assets/logo_horizontal.png" width="150" />
    </div>
    <h1 class="justify-self-center text-2xl text-gray-900 font-bold">Inscríbete a nuestro próximos eventos</h1>
    <ActiveEvents />
    <!-- <div
      class="card w-full bg-base-100 border border-base-600 rounded-lg lg:p-8"
    >
      <div class="card-body">
        <div class="flex items-center gap-6 flex-wrap md:flex-nowrap">
          <div class="responsive-iframe">
            <iframe
              src="https://www.instagram.com/reel/C_k7JOCOj2I/embed"
              frameborder="0"
              allowfullscreen="true"
              scrolling="no"
              allowtransparency="true"
            >
            </iframe>
          </div>
          <div>
            <h2 class="card-title">
              ¿Quieres este evento en tu casa, colegio u oficina?
            </h2>
            <div class="card-actions justify-start mt-4">
              <a href="https://wa.me/56989612263">
                <button class="btn btn-active mt-2">Contáctanos</button>
              </a>
            </div>
          </div>
        </div>
      </div> 
    </div>-->
  </div>
</template>

<script setup>
import ActiveEvents from "@/components/ActiveEvents.vue";
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
