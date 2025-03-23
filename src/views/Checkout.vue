<template>
  <div>
    <button class="btn bg-white border-none mb-4"  @click="$router.go(-1)">Volver</button>
    <div class="flex flex-col items-center gap-10">
      <img src="../assets/logo_horizontal.png" width="150">
      <GeneratePayment />
    </div>
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
