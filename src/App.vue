<template>
  <div class="flex flex-col min-h-screen">
    <div class="px-10 grow pb-5 md:max-w-4xl w-full m-auto">
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
  background-color: #f7f9ff;
  background-image: url('./assets/bg_web_header_sm.png');
  background-repeat: no-repeat;
  background-size: auto 55rem;
  background-position: center -10rem;
}
/* @media screen and (max-width: 600px) {
  #app {
    background-size: 170%;
    background-position: top center;
  }
}

@media screen and (min-width: 1200px) {
  #app {
    background-position: center -10rem;
  }
} */
</style>
