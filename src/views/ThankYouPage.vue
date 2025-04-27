<template>
  <div>
    <div class="flex flex-col items-center gap-6">
      <img src="../assets/logo_horizontal.png" width="150">
      <div v-if="paymentId === 'null'">
        <p>Hubo un problema con tu pago.<br>Asegurate de completar todo el proceso de pago o que tu medio de pago haya sido ingresado correctamente.</p>
        <button class="btn bg-white my-4 w-full" @click="$router.go(-1)">Volver a pantalla de pago</button>
      </div>
      <p v-else id="thank-you-message" class="text-xl mt-2">¡Gracias por asistir!</p>
        <p v-if="paymentId !== 'null'" class="text-sm mt-2">
          Si quieres llevar este concierto a tu casa, colegio u oficina; o quieres preguntarnos algo; o tal vez solo dejarnos tu feedback sobre tu experiencia (ya sea por mensaje escrito o audio)
          <a v-if="paymentId !== 'null'" href="https://wa.me/56989612263?text=Hola%2C%20quiero%20dar%20feedback%20sobre%20el%20concierto%20de%2040%20Minutos" class="btn btn-neutral text-white mt-4 w-full">Pincha acá</a>
          <button class="btn btn-outline border-black bg-transparent text-black mt-2 w-full" @click="finishConcert">Finalizar concierto</button>
        </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'; // Importa lo necesario de Firestore
import { db } from '@/firebase';

const route = useRoute();
const router = useRouter();

// Definir variable reactiva para almacenar los detalles del pago
const paymentDetails = ref(null);
const event = ref();

// Función para finalizar el concierto y regresar a la página principal
const finishConcert = () => {
  router.push('/');
};

// Obtener los parámetros de la URL
const paymentId = route.query.payment_id;
const idSpectator = route.query.idSpectator; 
const numberOfPeople = route.query.numberOfPeople;
const idVisitor = route.query.idVisitor;
const idEvent = route.query.idEvent;

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
        // Si no existe, añadir el nuevo pago (sin actualizar estado global)
        await updateDoc(spectatorRef, {
          payments: arrayUnion({
            paymentId: paymentId,
            numberOfPeople: numberOfPeople,
            paymentMethod: 'Mercado Pago',
            amount: paymentDetails.value.amount,
            date: new Date() // Timestamp del momento
          })
          // Ya no actualizamos isCheckedOut globalmente para evitar afectar otros eventos
        });
        
        // Actualizar el eventSpectator específico en el documento del evento
        if (idEvent) {
          const eventRef = doc(db, 'events', idEvent);
          const eventDoc = await getDoc(eventRef);
          
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const eventSpectators = eventData.eventSpectators || [];
            
            // Buscar el índice del espectador actual en el array de eventSpectators
            const spectatorIndex = eventSpectators.findIndex(s => s.id === idSpectator);
            
            if (spectatorIndex !== -1) {
              // Actualizar solo el registro del espectador para este evento específico
              eventSpectators[spectatorIndex] = {
                ...eventSpectators[spectatorIndex],
                isCheckedOut: true,
                wasCheckedOut: true
              };
              
              // Guardar los cambios en el documento del evento
              await updateDoc(eventRef, {
                eventSpectators: eventSpectators
              });
            }
          }
        }
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
    // Crear un ID único para el pago
    const paymentId = idSpectator + '-' + (idVisitor ? idVisitor : 'owner');
    
    // Actualizar el documento del espectador con la información del pago
    const spectatorRef = doc(db, 'spectators', idSpectator);
    const spectatorDoc = await getDoc(spectatorRef);
    const payments = spectatorDoc.data().payments || [];
    
    // Verificar si ya existe un pago con el mismo paymentId
    const paymentExists = payments.some(payment => payment.paymentId === paymentId);
    
    if (!paymentExists) {
      // Si no existe, añadir el nuevo pago (sin actualizar estado global de check-out)
      await updateDoc(spectatorRef, {
        payments: arrayUnion({
          paymentMethod: 'BankTransfer',
          numberOfPeople: numberOfPeople,
          paymentId: paymentId,
          amount: route.query.amount,
          date: new Date() // Timestamp del momento
        })
        // Ya no actualizamos isCheckedOut globalmente para evitar afectar otros eventos
      });
      
      // Actualizar el eventSpectator específico en el documento del evento
      if (route.query.idEvent) {
        const eventRef = doc(db, 'events', route.query.idEvent);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          const eventSpectators = eventData.eventSpectators || [];
          
          // Buscar el índice del espectador actual en el array de eventSpectators
          const spectatorIndex = eventSpectators.findIndex(s => s.id === idSpectator);
          
          if (spectatorIndex !== -1) {
            // Actualizar solo el registro del espectador para este evento específico
            eventSpectators[spectatorIndex] = {
              ...eventSpectators[spectatorIndex],
              isCheckedOut: true,
              wasCheckedOut: true
            };
            
            // Guardar los cambios en el documento del evento
            await updateDoc(eventRef, {
              eventSpectators: eventSpectators
            });
          }
        }
      }
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
  const eventDocRef = doc(db, 'events', idEvent);

  try {
    const eventDocSnap = await getDoc(eventDocRef);
    if (eventDocSnap.exists()) {
      event.value = eventDocSnap.data();
    } else {
      console.error('No se encontró el evento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos del evento:', error);
  }
};

// Llamar a la función cuando el componente se monte
onMounted(async () => {
  if (paymentId) {
    getPaymentDetails();
  } else {
    // Primero obtenemos los datos del evento
    await fetchEvents();
    // Luego actualizamos el pago, independientemente del método de pago
    updateZeroPaymentSpectator();
  }
});
</script>


<style lang="scss" scoped>

</style>
