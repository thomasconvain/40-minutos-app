<template>
  <div class="flex flex-col items-center gap-10">
    <img src="../assets/logo.png" width="200">
    <GeneratePayment />
  </div>
</template>

<script>
import GeneratePayment from '../components/GeneratePayment.vue'

export default {
  name: 'App',
  components: {
    GeneratePayment,
  }
}
</script>

<style>

</style>
