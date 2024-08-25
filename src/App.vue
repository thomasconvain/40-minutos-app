<template>

  <div class="flex bg-gray-50 min-h-screen">
    <div class="px-10 grow pb-5 md:max-w-4xl m-auto">
      <div>
        <router-view  />
      </div>
    </div>
  </div>
</template>

<script setup>

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
