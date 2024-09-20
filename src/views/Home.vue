<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <div class="flex flex-col items-center mb-10">
      <img src="../assets/logo.png" width="150">
    </div>
    <section class="py-8">
      <div class="mx-auto grid max-w-screen-xl rounded-lg bg-black p-8 md:p-8 lg:grid-cols-12 lg:gap-8 lg:p-16 xl:gap-16 background-circle">
        <div class="me-auto place-self-center lg:col-span-7">
          <h1 class="mb-3 text-2xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            Próximo evento:<br />
            Lunes 30 de septiembre | 19.30 hrs
          </h1>
          <p class="mb-6 text-gray-100">Colegio Santa Úrsula, VITACURA</p>
          <div class="flex flex-wrap gap-3">
            <a class="sm:w-auto w-full" href="https://wa.me/p/27280514998214599/56989612263" target="_blank">
              <button
                type="button"
                class="mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Consigue tu ticket aquí</span>
              </button>
            </a>
            <button
              type="button"
              class="mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-white shadow-sm text-sm font-medium rounded-md text-white hover:text-black bg-transparent hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="router.push({name: 'SignIn'})"
            >
              <span>Ya tengo ticket</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter(); // Importar el enrutador

</script>

<style scoped>
.background-circle {
  background-image: url('../assets/gradient_bg.png');
}
</style>
