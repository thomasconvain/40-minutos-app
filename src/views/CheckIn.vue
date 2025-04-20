<template>
  <div>
    <button class="btn bg-white border-none mb-4"  @click="$router.go(-1)">Volver</button>
    <div class="w-full">
      <ul class="steps w-full">
        <li class="step step-primary">Tus datos</li>
        <li class="step" :class="activeStep > 1 ? 'step-primary' : ''">Tu grupo</li>
        <li class="step" :class="activeStep > 2 ? 'step-primary' : ''">Instrucciones</li>
      </ul>
    </div>
    <div class="content my-8">
      <div v-if="activeStep === 1">
        <div class="card bg-base-100 border border-base-600 mt-6">
          <div v-if="spectator" class="card-body">
            <h2 class="card-title">Tus datos</h2>
            <p class="">Puedes modificar tus datos si no están correctos:</p>
            <label class="text-sm" for="email"><strong>Email</strong></label>
            <input v-model="spectator.email" type="text" placeholder="correo" class="input input-bordered w-full" />
            <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
            <label class="text-sm" for="email"><strong>Teléfono</strong></label>
            <input v-model="spectator.phone" type="text" placeholder="teléfono" class="input input-bordered w-full" />
            <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
          </div>
        </div>
      </div>
      <div v-if="activeStep === 2">
        <div class="card bg-base-100 border border-base-600 mt-6">
          <div v-if="spectator" class="card-body">
            <h2 class="card-title">Tu grupo</h2>
            <p class="">Confirma el número de acompañantes:</p>
            <input v-model="numberOfCompanions" type="number" min="0" placeholder="Ingresa el número de participantes" class="input input-bordered w-full" />
            <div v-if="numberOfCompanions >= 1">
              <label class="label cursor-pointer flex justify-start gap-2">
                <input type="checkbox" class="checkbox checkbox-primary" :checked="uniquePaymentForGroup" @change="uniquePaymentForGroup = !uniquePaymentForGroup" />
                <span class="label-text">Quiero pagar para todo mi grupo al final del concierto ({{ numberOfCompanions + 1 }} personas en total)</span>
              </label>
              <div class="mt-4 alert alert-info rounded-none">
                <span class="text-xs">Comparte al link del programa del concierto a tu grupo para que puedan seguir con la experiencia en sus propios dispositivos</span>
              </div>
              <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/sign-in/${eventParams}/?referenceLink=true%26hostId=${spectator.uId}`'>
                <button class="btn btn-active mt-2 w-full"><ShareIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Acompañantes link</button>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeStep === 3">
        <div class="card bg-base-100 border border-base-600 mt-6">
          <div v-if="spectator" class="card-body">
            <h2 class="card-title">¡Bienvenido/a!</h2>
            {{event.checkinInstructions}}
          </div>
        </div>
      </div>
    </div>
    <div class="controllers mt-4 grid justify-items-stretch w-full" :class="activeStep === 1 ? 'grid-cols-1' : 'grid-cols-2'">
      <button v-if="activeStep > 1" class="btn justify-self-start" @click="activeStep -= 1">Anterior</button>
      <button v-if="activeStep < 3" class="btn btn-primary justify-self-end text-white" @click="validateFormat()">Siguiente</button>
      <button v-if="activeStep === 3" class="btn btn-primary justify-self-end w-full animate-bounce text-white" @click="validateCheckin">Entrar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ShareIcon } from '@heroicons/vue/24/outline'


const activeStep = ref(1);
const spectator = ref(null);
const numberOfCompanions = ref(0);
const event = ref(null);
const uniquePaymentForGroup = ref(true);
const emailError = ref('');
const phoneError = ref('');
const randomId = ref('');
const spectatorParams = ref('');
const eventParams = ref('');

const route = useRoute();
const router = useRouter(); // Instancia de Vue Router
const id = route.params.idSpectator;


const fetchSpectator = async () => {
  const db = getFirestore();
  
  try {
    // Cargar el documento del espectador
    const spectatorRef = doc(db, 'spectators', id);
    const spectatorSnap = await getDoc(spectatorRef);
    
    if (!spectatorSnap.exists()) {
      console.error('No se encontró el documento del espectador con el ID proporcionado');
      return;
    }
    
    // Guardar los datos del espectador
    spectator.value = spectatorSnap.data();
    
    // No establecer un valor por defecto todavía, primero intentaremos obtener el valor del eventSpectator
    
    // Ahora intentar cargar los datos específicos del evento
    try {
      const eventRef = doc(db, 'events', route.params.idEvent);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        
        // Verificar si el array eventSpectators existe
        if (Array.isArray(eventData.eventSpectators)) {
          console.log('Total de eventSpectators:', eventData.eventSpectators.length);
          
          // Buscar el espectador específico para este evento
          const spectatorIndex = eventData.eventSpectators.findIndex(s => s.id === id);
          console.log('Índice del espectador en eventSpectators:', spectatorIndex);
          
          if (spectatorIndex !== -1) {
            const eventSpectator = eventData.eventSpectators[spectatorIndex];
            console.log('eventSpectator encontrado:', eventSpectator);
            
            // Obtener el valor de numberOfCompanions de eventSpectator 
            console.log('Usando numberOfCompanions de eventSpectator:', eventSpectator.numberOfCompanions);
            numberOfCompanions.value = eventSpectator.numberOfCompanions || 0;
            
            // También actualizar la preferencia de pago si existe
            if (eventSpectator.uniquePaymentForGroup !== undefined) {
              uniquePaymentForGroup.value = eventSpectator.uniquePaymentForGroup;
            }
          } else {
            console.log('Espectador no encontrado en eventSpectators, usando valor general');
            // Si no encontramos el eventSpectator, usamos el valor general como respaldo
            numberOfCompanions.value = spectator.value.numberOfPeople - 1;
          }
        } else {
          console.log('El evento no tiene eventSpectators o no es un array, usando valor general');
          // Si no hay eventSpectators, usamos el valor general
          numberOfCompanions.value = spectator.value.numberOfPeople - 1;
        }
      } else {
        console.log('El evento no existe, usando valor general');
        // Si no hay evento, usamos el valor general
        numberOfCompanions.value = spectator.value.numberOfPeople - 1;
      }
    } catch (eventError) {
      console.error('Error al cargar datos del evento:', eventError);
      // En caso de error, usamos el valor general
      numberOfCompanions.value = spectator.value.numberOfPeople - 1;
    }
  } catch (error) {
    console.error('Error al obtener los datos del espectador:', error);
  }
};

const fetchEvents = async () => {
  const db = getFirestore();
  const docRef = doc(db, 'events', route.params.idEvent);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const eventData = docSnap.data();
      event.value = eventData;
      
      // Obtener datos de content-manager si existe contentReferenceId
      if (eventData.contentReferenceId) {
        try {
          const contentRef = doc(db, 'content-manager', eventData.contentReferenceId);
          const contentSnap = await getDoc(contentRef);
          
          if (contentSnap.exists()) {
            const contentData = contentSnap.data();
            // Actualizar el evento con datos del content-manager
            if (contentData.checkin && contentData.checkin.instructions) {
              event.value = {
                ...event.value,
                checkinInstructions: contentData.checkin.instructions
              };
            }
          }
        } catch (contentError) {
          console.error('Error al obtener datos de content-manager:', contentError);
        }
      }
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos del evento:', error);
  }
};

const validateCheckin = async () => {
  const db = getFirestore();
  const spectatorRef = doc(db, 'spectators', id); // Usa el id del espectador de los params
  const eventRef = doc(db, 'events', route.params.idEvent); // Referencia al evento actual
  
  try {
    // Actualizar solo los datos básicos del espectador sin cambiar el estado global de check-in
    await updateDoc(spectatorRef, {
      email: spectator.value.email,
      phone: spectator.value.phone,
      numberOfPeople: numberOfCompanions.value + 1,
      uniquePaymentForGroup: uniquePaymentForGroup.value,
      // Ya no actualizamos isChecked globalmente para evitar afectar otros eventos
    });

    // Obtener el documento del evento para actualizar el eventSpectator específico
    const eventDoc = await getDoc(eventRef);
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      const eventSpectators = eventData.eventSpectators || [];
      
      // Buscar el índice del espectador actual en el array de eventSpectators
      const spectatorIndex = eventSpectators.findIndex(s => s.id === id);
      
      if (spectatorIndex !== -1) {
        // Actualizar solo el registro del espectador para este evento específico
        eventSpectators[spectatorIndex] = {
          ...eventSpectators[spectatorIndex],
          isChecked: true,
          wasCheckedIn: true,
          numberOfCompanions: numberOfCompanions.value,
          uniquePaymentForGroup: uniquePaymentForGroup.value
        };
        
        // Guardar los cambios en el documento del evento
        await updateDoc(eventRef, {
          eventSpectators: eventSpectators
        });
      }
    }
    
    console.log('Datos del espectador y check-in actualizados correctamente');
    router.push({
      name: 'EventDetail',
      params: { idSpectator: route.params.idSpectator, idEvent: route.params.idEvent, nameEvent: route.params.nameEvent },
    });
  } catch (error) {
    console.error('Error al actualizar los datos del check-in:', error);
  }
};

// Validación del email
const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(spectator.value.email)) {
    emailError.value = 'Por favor ingresa un correo válido.';
  } else {
    emailError.value = '';
  }
};

const validatePhone = () => {
  const phonePattern = /^\+56\d{9}$/; // Formato para números de teléfono en Chile: +56XXXXXXXXX
  if (!phonePattern.test(spectator.value.phone)) {
    phoneError.value = 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX.';
  } else {
    phoneError.value = '';
  }
};

const validateFormat = () => {
  validateEmail();
  validatePhone();
  if (emailError.value === '' && phoneError.value === '') {
    activeStep.value +=1;
  }
}

// Definir la función para generar el ID aleatorio
function generateRandomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  randomId.value = result;
}

onMounted(() => {
  spectatorParams.value = route.params.idSpectator;
  eventParams.value = route.params.idEvent;
  fetchSpectator();
  fetchEvents();
  generateRandomId();
});

</script>

<style lang="scss" scoped>

</style>