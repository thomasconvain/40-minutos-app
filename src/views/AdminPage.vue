<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="logout">Cerrar sesión</button>
    <p>El total personas inscritas: {{ totalNumberOfPeople }}</p>
    <p>Total Mercado Pago: {{ totalMercadoPago }}</p>
    <p>Total Bank Transfer: {{ totalBankTransfer }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de tener configurada tu instancia de Firebase
import { signOut } from 'firebase/auth'; // Importar la función para cerrar sesión
import { auth } from '@/firebase'; // Tu configuración de Firebase
import { useRouter } from 'vue-router'; // Para redirigir al usuario

const totalNumberOfPeople = ref(0);
const totalMercadoPago = ref(0);
const totalBankTransfer = ref(0);

const router = useRouter(); // Instancia de Vue Router

const logout = async () => {
  try {
    await signOut(auth); // Cierra la sesión
    console.log('Sesión cerrada con éxito');
    router.push('/login'); // Redirige al usuario a la página de inicio
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
  }
};

const fetchSpectators = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'spectators'));
    let total = 0;
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.numberOfPeople) {
        total += data.numberOfPeople;
      }
    });

    totalNumberOfPeople.value = total;
  } catch (error) {
    console.error('Error obteniendo los documentos: ', error);
  }
};

const fetchSpectatorsPayments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'spectators'));
    let mercadoPagoTotal = 0;
    let bankTransferTotal = 0;
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.payments && Array.isArray(data.payments)) {
        data.payments.forEach(payment => {
          if (payment.amount && payment.paymentMethod) {
            if (payment.paymentMethod === 'Mercado Pago') {
              mercadoPagoTotal += payment.amount;
            } else if (payment.paymentMethod === 'BankTransfer') {
              bankTransferTotal += parseFloat(payment.amount);
            }
          }
        });
      }
    });

    totalMercadoPago.value = mercadoPagoTotal;
    totalBankTransfer.value = bankTransferTotal;
  } catch (error) {
    console.error('Error obteniendo los documentos: ', error);
  }
};

onMounted(() => {
  fetchSpectators();
  fetchSpectatorsPayments();
});
</script>
