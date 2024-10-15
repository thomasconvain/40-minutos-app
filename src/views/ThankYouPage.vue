<template>
  <div>
    <button v-if="!paymentId" class="btn bg-white border-none mb-4"  @click="$router.go(-1)">Volver</button>
    <div class="flex flex-col items-center gap-10">
      <img src="../assets/logo.png" width="150">
      <div v-if="paymentId === 'null'">
        <p>Hubó un problema con tu pago.<br>Asegurate de completar todo el proceso de pago o que tu medio de pago haya sido ingresado correctamente.</p>
        <button class="btn bg-white my-4 w-full" @click="$router.go(-1)">Volver a pantalla de pago</button>
      </div>
      <p v-else class="text-xl">Gracias por asistir!</p>
      <div v-if="event?.isFreeEntrance">
        <p v-if="formattedAmount">Tu aporte: {{ formattedAmount }}</p>
        <div v-if="route.query.paymentMethod === 'bankTransfer'" class="w-full">
          <div class="alert alert-info rounded-none">
          <InformationCircleIcon class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
          <span class="text-xs">Realiza tu transferencia con los siguientes datos:</span>
        </div>
          <div class="overflow-x-auto flex flex-col items-end mt-4">
            <button class="btn btn-sm max-w-40 mr-0" @click="copyToClipboard"><DocumentDuplicateIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Copiar datos </button>
            <p class="text-sm text-gray-600">{{ copiedMessage }}</p>
            <table class="table">
              <tbody>
                <!-- row 1 -->
                <tr>
                  <td>Nombre</td>
                  <td>{{ event?.bankTransferData.name }}</td>
                </tr>
                <!-- row 2 -->
                <tr>
                  <td>RUT</td>
                  <td>{{ event?.bankTransferData.id }}</td>
                </tr>
                <!-- row 3 -->
                <tr>
                  <td>Banco</td>
                  <td>{{ event?.bankTransferData.bank }}</td>
                </tr>
                <!-- row 4 -->
                <tr>
                  <td>Tipo</td>
                  <td>{{ event?.bankTransferData.type }}</td>
                </tr>
                <!-- row 5 -->
                <tr>
                  <td>Cuenta</td>
                  <td>{{ event?.bankTransferData.bankAccount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p>Si tienes dudas con tu pago, puedes escribirnos <a class="underline" href="https://wa.me/56989612263">acá</a>.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'; // Importa lo necesario de Firestore
import { db } from '@/firebase';
import { InformationCircleIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline'


// const router = useRouter();
const route = useRoute();

// Definir variable reactiva para almacenar los detalles del pago
const paymentDetails = ref(null);
const event = ref();
const textToCopy = ref();
const copiedMessage = ref('');

// Obtener el payment_id desde los parámetros de la URL
const paymentId = route.query.payment_id;
const idSpectator = route.query.idSpectator; 
const numberOfPeople = route.query.numberOfPeople;
const idVisitor = route.query.idVisitor; 

// Función para obtener detalles del pago desde Firebase Functions
const getPaymentDetails = async () => {
  try {
    // Asegúrate de usar la URL correcta para tu Firebase Function
    const response = await axios.get(`https://us-central1-minutos-87fe9.cloudfunctions.net/getPaymentDetails?payment_id=${paymentId}`);
    
    // Almacenar los detalles del pago en paymentDetails
    paymentDetails.value = response.data;
    
    // Referencia al documento del espectador
    const spectatorRef = doc(db, 'spectators', idSpectator);
    
    // Obtener el documento actual del espectador
    const spectatorDoc = await getDoc(spectatorRef);
    
    if (spectatorDoc.exists()) {
      const payments = spectatorDoc.data().payments || [];
      
      // Verificar si ya existe un pago con el mismo mercadoPagoId
      const paymentExists = payments.some(payment => payment.paymentId === paymentId);
      
      if (!paymentExists) {
        // Si no existe, añadir el nuevo pago
        await updateDoc(spectatorRef, {
          payments: arrayUnion({
            paymentId: paymentId,
            numberOfPeople: numberOfPeople,
            paymentMethod: 'Mercado Pago',
            amount: paymentDetails.value.amount,
            date: new Date() // Timestamp del momento
          })
        });
      } else {
        console.log('El pago ya existe con ese mercadoPagoId');
      }
    } else {
      console.error('El documento del espectador no existe');
    }
    
  } catch (error) {
    console.error('Error al obtener detalles del pago:', error);
    const spectatorRef = doc(db, 'spectators', idSpectator);
    await updateDoc(spectatorRef, {
          payments: arrayUnion({
            paymentId: 'failed payment',
            numberOfPeople: numberOfPeople,
            paymentMethod: 'Mercado Pago',
            amount: 0,
            date: new Date() // Timestamp del momento
          })
        });
  }
};


const updateZeroPaymentSpectator = async () => {
  try {
    const spectatorRef = doc(db, 'spectators', idSpectator);
    const spectatorDoc = await getDoc(spectatorRef);
    const payments = spectatorDoc.data().payments || [];
    // Verificar si ya existe un pago con el mismo paymentId
    const paymentExists = payments.some(payment => payment.paymentId === idSpectator + '-' + (idVisitor ? idVisitor : 'owner'));
    if (!paymentExists) {
      // Si no existe, añadir el nuevo pago
      await updateDoc(spectatorRef, {
        payments: arrayUnion({
          paymentMethod: 'BankTransfer',
          numberOfPeople: numberOfPeople,
          paymentId: idSpectator + '-' + (idVisitor ? idVisitor : 'owner'),
          amount: route.query.amount,
          date: new Date() // Timestamp del momento
        })
      });
    } else {
      console.log('El pago ya existe con ese paymentId');
    }
  } catch (error) {
    console.error('Error al actualizar pagos del espectador:', error)
  }
}

// Función para obtener los detalles de los eventos usando los IDs
const fetchEvents = async () => {
  const db = getFirestore();
  const docRef = doc(db, 'events', route.query.idEvent);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      event.value = docSnap.data();
      textToCopy.value = `${event.value.bankTransferData.name} ${event.value.bankTransferData.id} ${event.value.bankTransferData.bank} ${event.value.bankTransferData.type} ${event.value.bankTransferData.bankAccount}`;
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos bancarios del evento:', error);
  }
};

// Función para copiar al portapapeles
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(textToCopy.value);
    copiedMessage.value = 'Datos copiado al portapapeles';
    
    // Limpiar el mensaje después de 2 segundos
    setTimeout(() => {
      copiedMessage.value = '';
    }, 2000);
  } catch (error) {
    copiedMessage.value = 'Error al copiar el texto';
    console.error('Error al copiar al portapapeles:', error);
  }
};

const formattedAmount = computed(() => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(paymentDetails.value ? paymentDetails.value.amount : paymentId === 'null' ? 0 : route.query.amount);
});

// Llamar a la función cuando el componente se monte
onMounted(() => {
  if (paymentId) {
    getPaymentDetails();
  } else {
  updateZeroPaymentSpectator();
  fetchEvents(route.query.idEvent);
  }
});
</script>


<style lang="scss" scoped>

</style>
