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
            <input v-model="spectator.numberOfPeople" type="number" min="1" placeholder="Ingresa el número de participantes" class="input input-bordered w-full" />
            <div v-if="spectator.numberOfPeople > 1">
              <label class="label cursor-pointer flex justify-start gap-2">
                <input type="checkbox" class="checkbox checkbox-primary" :checked="uniquePaymentForGroup" @change="uniquePaymentForGroup = !uniquePaymentForGroup" />
                <span class="label-text">Quiero pagar para todo mi grupo al final del concierto</span>
              </label>
              <div class="mt-4 alert alert-info rounded-none">
                <span class="text-xs">Comparte al link del programa del concierto a tu grupo para que puedan seguir con la experiencia en sus propios dispositivos</span>
              </div>
              <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/booking/${eventParams}/?referenceLink=true%26hostId=${spectator.uId}`'>
                <button class="btn btn-active mt-2 w-full"><ShareIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Compartir link</button>
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
  const docRef = doc(db, 'spectators', id);
  
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
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
      event.value = docSnap.data();
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos del evento:', error);
  }
};

const validateCheckin = async () => {
  const db = getFirestore();
  const docRef = doc(db, 'spectators', id); // Usa el id del espectador de los params
  
  try {
    await updateDoc(docRef, {
      email: spectator.value.email,
      phone: spectator.value.phone,
      numberOfPeople: spectator.value.numberOfPeople,
      uniquePaymentForGroup: uniquePaymentForGroup.value,
      isChecked: true,
    });
    console.log('Datos del espectador actualizados correctamente');
    router.push({
    name: 'EventDetail',
    params: { idSpectator: route.params.idSpectator, idEvent: route.params.idEvent, nameEvent: route.params.nameEvent },
  });
  } catch (error) {
    console.error('Error al actualizar los datos del espectador:', error);
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