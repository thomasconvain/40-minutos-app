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
          <div v-if="isEmailCheckIn && !spectator" class="card-body">
            <h2 class="card-title">Ingresa tu email</h2>
            <p class="">Ingresa el email con el que te registraste al concierto:</p>
            <label class="text-sm" for="email"><strong>Email</strong></label>
            <input v-model="emailInput" type="email" placeholder="correo" class="input input-bordered w-full" />
            <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
            <button class="btn btn-primary mt-4" @click="findSpectatorByEmail">Buscar</button>
            <p v-if="spectatorNotFound" class="text-red-500 text-sm mt-2">No se encontró un registro con este email para este evento.</p>
          </div>
          <div v-else-if="spectator" class="card-body">
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
import { ref, onMounted, computed } from 'vue';
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
const emailInput = ref('');
const spectatorNotFound = ref(false);

const route = useRoute();
const router = useRouter(); // Instancia de Vue Router
const id = route.params.idSpectator;

const isEmailCheckIn = computed(() => route.name === 'EmailCheckIn');


const findSpectatorByEmail = async () => {
  if (!emailInput.value) {
    emailError.value = 'Por favor ingresa tu email';
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailInput.value)) {
    emailError.value = 'Por favor ingresa un correo válido';
    return;
  }

  const db = getFirestore();
  spectatorNotFound.value = false;
  emailError.value = '';

  try {
    // Buscar el evento actual para obtener los espectadores registrados
    const eventRef = doc(db, 'events', route.params.idEvent);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      spectatorNotFound.value = true;
      return;
    }

    const eventData = eventSnap.data();
    const zSpectator = eventData.zSpectator || [];
    
    // Buscar todos los espectadores registrados para este evento
    let foundSpectatorId = null;
    
    for (const spec of zSpectator) {
      // Obtener los datos del espectador desde la colección spectators
      const spectatorRef = doc(db, 'spectators', spec.spectatorId);
      const spectatorSnap = await getDoc(spectatorRef);
      
      if (spectatorSnap.exists()) {
        const spectatorData = spectatorSnap.data();
        if (spectatorData.email && spectatorData.email.toLowerCase() === emailInput.value.toLowerCase()) {
          foundSpectatorId = spec.spectatorId;
          spectator.value = spectatorData;
          numberOfCompanions.value = spec.numberOfCompanions || 0;
          break;
        }
      }
    }

    if (!foundSpectatorId) {
      spectatorNotFound.value = true;
      return;
    }

    // Actualizar los parámetros para usar el espectador encontrado
    spectatorParams.value = foundSpectatorId;
    
  } catch (error) {
    console.error('Error al buscar el espectador:', error);
    spectatorNotFound.value = true;
  }
};

const fetchSpectator = async () => {
  // Si es email check-in, no intentar cargar el espectador por ID hasta que se busque por email
  if (isEmailCheckIn.value) {
    return;
  }

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
    
    // Ahora intentar cargar los datos específicos del evento
    try {
      const eventRef = doc(db, 'events', route.params.idEvent);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        
        // Verificar si el array zSpectator existe
        if (Array.isArray(eventData.zSpectator)) {
          console.log('Total de espectadores en zSpectator:', eventData.zSpectator.length);
          
          // Buscar el espectador específico para este evento en zSpectator
          const spectatorIndex = eventData.zSpectator.findIndex(s => s.spectatorId === id);
          console.log('Índice del espectador en zSpectator:', spectatorIndex);
          
          if (spectatorIndex !== -1) {
            const spectatorData = eventData.zSpectator[spectatorIndex];
            console.log('Datos del espectador en zSpectator:', spectatorData);
            
            // Obtener el valor de numberOfCompanions de zSpectator
            console.log('Usando numberOfCompanions de zSpectator:', spectatorData.numberOfCompanions);
            numberOfCompanions.value = spectatorData.numberOfCompanions || 0;
            return;
          }
        }
        
        // Si no se encontró en zSpectator, usar valor por defecto
        console.log('Espectador no encontrado en zSpectator o no existe zSpectator, usando valor por defecto');
        numberOfCompanions.value = spectator.value.numberOfPeople ? (spectator.value.numberOfPeople - 1) : 0;
      } else {
        console.log('El evento no existe, usando valor por defecto');
        numberOfCompanions.value = spectator.value.numberOfPeople ? (spectator.value.numberOfPeople - 1) : 0;
      }
    } catch (eventError) {
      console.error('Error al cargar datos del evento:', eventError);
      // En caso de error, usamos el valor por defecto
      numberOfCompanions.value = spectator.value.numberOfPeople ? (spectator.value.numberOfPeople - 1) : 0;
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
  // Usar el ID del espectador encontrado por email o el de los parámetros
  const spectatorId = isEmailCheckIn.value ? spectatorParams.value : id;
  const spectatorRef = doc(db, 'spectators', spectatorId);
  const eventRef = doc(db, 'events', route.params.idEvent);
  
  try {
    // Actualizar solo los datos básicos del espectador sin cambiar el estado global de check-in
    await updateDoc(spectatorRef, {
      email: spectator.value.email,
      phone: spectator.value.phone,
      numberOfPeople: numberOfCompanions.value + 1,
      uniquePaymentForGroup: uniquePaymentForGroup.value,
      // Ya no actualizamos isChecked globalmente para evitar afectar otros eventos
    });

    // Obtener el documento del evento para actualizar el zSpectator específico (nueva estructura)
    const eventDoc = await getDoc(eventRef);
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      const zSpectator = eventData.zSpectator || [];
      
      // Buscar el índice del espectador actual en el array de zSpectator
      const spectatorIndex = zSpectator.findIndex(s => s.spectatorId === spectatorId);
      
      if (spectatorIndex !== -1) {
        // Actualizar solo el registro del espectador para este evento específico
        // usando los nuevos campos de la estructura
        zSpectator[spectatorIndex] = {
          spectatorId: spectatorId,
          hasCheckIn: true,
          numberOfCompanions: numberOfCompanions.value,
          // Asegurarnos de mantener nameComplete o crearlo si no existe
          nameComplete: zSpectator[spectatorIndex].nameComplete || 
            `${spectator.value.name || ''} ${spectator.value.lastName || ''}`.trim(),
          // Mantenemos los demás campos que existan
          evaluationId: zSpectator[spectatorIndex].evaluationId || null,
          hasCheckOut: zSpectator[spectatorIndex].hasCheckOut || false,
          paymentId: zSpectator[spectatorIndex].paymentId || null,
          createdAt: zSpectator[spectatorIndex].createdAt || new Date()
        };
        
        // Guardar los cambios en el documento del evento
        await updateDoc(eventRef, {
          zSpectator: zSpectator
        });
      }
    }
    
    console.log('Datos del espectador y check-in actualizados correctamente');
    router.push({
      name: 'EventDetail',
      params: { idSpectator: spectatorId, idEvent: route.params.idEvent, nameEvent: route.params.nameEvent },
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
  if (isEmailCheckIn.value && !spectator.value) {
    // Si es email check-in y no se ha encontrado un espectador aún, no permitir avanzar
    return;
  }
  
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