<template>
  <div class="flex flex-col items-center gap-10">
    <img src="../assets/logo.png" width="200">
    <p class="text-xl">Gracias por asistir!</p>
    <p v-if="paymentDetails">Monto pagado: {{ paymentDetails.amount }}</p>
    <p v-else>Cargando detalles del pago...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Definir variable reactiva para almacenar los detalles del pago
const paymentDetails = ref(null);

// Obtener el payment_id desde los parámetros de la URL
const paymentId = new URLSearchParams(window.location.search).get('payment_id');

// Función para obtener detalles del pago desde Firebase Functions
const getPaymentDetails = async () => {
  try {
    // Asegúrate de usar la URL correcta para tu Firebase Function
    const response = await axios.get(`https://us-central1-minutos-87fe9.cloudfunctions.net/getPaymentDetails?payment_id=${paymentId}`);
    
    // Almacenar los detalles del pago en paymentDetails
    paymentDetails.value = response.data;
  } catch (error) {
    console.error('Error al obtener detalles del pago:', error);
  }
};

// Llamar a la función cuando el componente se monte
onMounted(() => {
  if (paymentId) {
    getPaymentDetails();
  }
});
</script>


<style lang="scss" scoped>

</style>
