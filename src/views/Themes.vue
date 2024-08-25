<template>
  <div class="flex flex-col items-center gap-10">
    <ThemesList />
  </div>
</template>

<script>
import ThemesList from '../components/ThemesList.vue'

export default {
  name: 'App',
  components: {
    ThemesList,
  }
}
</script>

<style>

</style>
