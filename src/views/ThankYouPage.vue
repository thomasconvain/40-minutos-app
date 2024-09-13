<template>
  <div class="flex flex-col items-center gap-10">
    <img src="../assets/logo.png" width="200">
    <p class="text-xl">Gracias por asistir!</p>
    <p>Tu aporte: {{ paymentDetails ? formattedAmount : formattedAmount = '$0' }}</p>
    {{ route.query }}
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; // Importa lo necesario de Firestore
import { db } from '@/firebase';

// const router = useRouter();
const route = useRoute();

// Definir variable reactiva para almacenar los detalles del pago
const paymentDetails = ref(null);

// Obtener el payment_id desde los parámetros de la URL
const paymentId = route.query.payment_id;
const idSpectator = route.query.idSpectator; 

// Función para obtener detalles del pago desde Firebase Functions
const getPaymentDetails = async () => {
  try {
    // Asegúrate de usar la URL correcta para tu Firebase Function
    const response = await axios.get(`https://us-central1-minutos-87fe9.cloudfunctions.net/getPaymentDetails?payment_id=${paymentId}`);
    
    // Almacenar los detalles del pago en paymentDetails
    paymentDetails.value = response.data;
    const spectatorRef = doc(db, 'spectators', idSpectator);
      await updateDoc(spectatorRef, {
        payments: arrayUnion({
          amount: paymentDetails.value.amount,
          date: new Date() // Timestamp del momento
        })
      });
  } catch (error) {
    console.error('Error al obtener detalles del pago:', error);
  }
};

const updateZeroPaymentSpectator = async () => {
  try {
      const spectatorRef = doc(db, 'spectators', idSpectator);
      await updateDoc(spectatorRef, {
        payments: arrayUnion({
          amount: 0,
          date: new Date() // Timestamp del momento
        })
      });
    } catch (error) {
      console.error('Error al actualizar pagos del espectador:', error)
    }
}

const formattedAmount = computed(() => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(paymentDetails.value.amount);
});

// Llamar a la función cuando el componente se monte
onMounted(() => {
  if (paymentId) {
    getPaymentDetails();
    sessionStorage.setItem('redirectedFromMercadoPago', 'true');
  } else {
  updateZeroPaymentSpectator();
  }
});
</script>


<style lang="scss" scoped>

</style>
