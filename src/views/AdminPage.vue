<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="logout">Cerrar sesión</button>
    <p>Total personas inscritas: {{ totalNumberOfPeople }}</p>
    <p>Personas con checkin: {{ totalNumberOfPeopleChecked }}</p>
    <p>Personas checkeadas sin pago registrado: {{ totalNumberOfPeopleWithoutPayments }}</p>
    <p>Total Mercado Pago: {{ totalMercadoPago }}</p>
    <p>Total Bank Transfer: {{ totalBankTransfer }}</p>
    <p>Monto promedio: {{ averagePayment }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de tener configurada tu instancia de Firebase
import { signOut } from 'firebase/auth'; // Importar la función para cerrar sesión
import { auth } from '@/firebase'; // Tu configuración de Firebase
import { useRouter } from 'vue-router'; // Para redirigir al usuario

const totalNumberOfPeople = ref(0);
const totalMercadoPago = ref(0);
const totalBankTransfer = ref(0);
const averagePayment = ref(0);
const totalNumberOfPeopleChecked = ref(0);
const totalNumberOfPeopleWithoutPayments = ref(0)

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

const fetchTotalNumberOfPeopleChecked = async () => {
  try {
    const q = query(collection(db, 'spectators'), where('isChecked', '==', true));
    const querySnapshot = await getDocs(q);
    let numberOfPeopleCheckedTotal = 0;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.numberOfPeople) {
        numberOfPeopleCheckedTotal += parseFloat(data.numberOfPeople);
      }
    });
    totalNumberOfPeopleChecked.value = numberOfPeopleCheckedTotal; // Actualiza el valor reactivo
  } catch (error) {
    console.error('Error obteniendo los documentos con isChecked: true: ', error);
    return 0;
  }
};

const fetchTotalNumberOfPeopleWithoutPayments = async () => {
  try {
    const q = query(collection(db, 'spectators'), where('isChecked', '==', true));
    const querySnapshot = await getDocs(q);
    let numberOfPeopleWithoutPaymentsTotal = 0;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Verifica si 'payments' no existe en el documento
      if (!data.payments && data.numberOfPeople) {
        numberOfPeopleWithoutPaymentsTotal += data.numberOfPeople;
      }
    });
    totalNumberOfPeopleWithoutPayments.value = numberOfPeopleWithoutPaymentsTotal;
  } catch (error) {
    console.error('Error obteniendo los documentos sin payments: ', error);
    return 0;
  }
};



const fetchSpectatorsPayments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'spectators'));
    let mercadoPagoTotal = 0;
    let bankTransferTotal = 0;
    let totalNumberOfPeople = 0; // Para sumar el total de personas en todos los pagos
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.payments && Array.isArray(data.payments)) {
        data.payments.forEach(payment => {
          if (payment.amount && payment.paymentMethod && payment.numberOfPeople) {
            const peopleCount = parseFloat(payment.numberOfPeople) || 1; // Si no hay numberOfPeople, lo contamos como 1 persona
            totalNumberOfPeople += peopleCount;

            if (payment.paymentMethod === 'Mercado Pago') {
              mercadoPagoTotal += payment.amount;
            } else if (payment.paymentMethod === 'BankTransfer') {
              bankTransferTotal += parseFloat(payment.amount);
            }
          }
        });
      }
    });

    const totalPayments = mercadoPagoTotal + bankTransferTotal;
    const averagePaymentPerPerson = totalPayments / totalNumberOfPeople;

    totalMercadoPago.value = mercadoPagoTotal;
    totalBankTransfer.value = bankTransferTotal;
    averagePayment.value = Math.round(averagePaymentPerPerson); // Guardas el monto promedio en una variable reactiva

    console.log('Promedio pagado por persona:', averagePaymentPerPerson);
  } catch (error) {
    console.error('Error obteniendo los documentos: ', error);
  }
};


onMounted(() => {
  fetchSpectators();
  fetchTotalNumberOfPeopleChecked();
  fetchSpectatorsPayments();
  fetchTotalNumberOfPeopleWithoutPayments();
});
</script>
