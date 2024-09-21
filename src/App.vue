<template>
  <div class="flex flex-col bg-gray-50 min-h-screen">
    <div class="px-10 grow pb-5 md:max-w-4xl m-auto">
      <div class="py-10">
        <router-view  />
      </div>
    </div>
    <FooterApp></FooterApp>
  </div>
</template>

<script setup>
import FooterApp from './components/FooterApp.vue';

</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
