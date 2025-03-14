<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="$router.go(-1)">Volver</button>
    <h1 class="text-2xl font-bold mb-6">{{ nameEvent }}</h1>
    <p class="mb-6">{{ eventDescription }}</p>
    <div v-if="themes.length">
      <div class="my-8" v-if="spectator.numberOfPeople > 1">
        <div class="alert alert-info rounded-none">
          <span class="text-xs">Comparte al link del programa del concierto a tu grupo para que puedan seguir con la experiencia en sus propios dispositivos</span>
        </div>
        <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/event/${spectatorParams}/${eventParams}/?referenceLink=true%26idVisitor=visitor-${randomId}`'>
          <button class="btn btn-active mt-2 w-full"><ShareIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Compartir link</button>
        </a>
      </div>
      <h2 class="text-xl font-semibold mb-4">Programa:</h2>
      <ul>
        <li v-for="theme in themes" :key="theme.id" class="mb-4 bg-white rounded-md">
          <ThemeItem :theme="theme" @onRateChange="handleRateChange"/>
        </li>
      </ul>
    </div>
    <div v-else class="mb-4 p-4 border bg-white rounded-md w-full">
    <div class="skeleton h-6 w-32 rounded-none"></div>
    <div class="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4">
      <div class="skeleton h-20 w-20 shrink-0 rounded-full"></div>
      <div class="my-4 flex flex-col grow gap-2">
        <div class="skeleton h-4 w-20 rounded-none "></div>
        <div class="skeleton h-32 w-full rounded-none"></div>
        <div>
          <div class="skeleton h-4 w-20 mb-2 rounded-none"></div>
          <div class="flex items-center">
          <div class="skeleton h-4 w-32 rounded-none"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
    <!-- <p v-else class="text-red-500">Cargando detalles del evento y temas...</p> -->
    <div v-if="ratings.length !== themes.length" class="alert alert-info rounded-none">
      <InformationCircleIcon class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
      <span class="text-xs">Parece que no evaluaste todas las obras que hemos tocado. Nos encantaría conocer tu opinión antes de continuar. 🤓</span>
    </div>
    <button
      type="button"
      :disabled="isButtonDisabled"
      class="btn-md btn btn-primary text-white w-full mt-4"
      @click="goToCheckout"
    >
      <span v-if="!isLoading">Checkout</span>
      <span v-else class="loading loading-dots loading-sm"></span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, updateDoc,  getFirestore } from 'firebase/firestore';
import { db } from '@/firebase';
import ThemeItem from '@/components/ThemeItem.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline'



const route = useRoute();
const router = useRouter();
const nameEvent = route.params.nameEvent;
const idEvent = route.params.idEvent;
const idSpectator = route.params.idSpectator;
const eventDescription = ref('');
const spectator = ref(null);
const id = route.params.idSpectator;
const randomId = ref('');
const spectatorParams = ref('');
const eventParams = ref('');
const isFreeEntrance = ref(true)

const themes = ref([]);
const ratings = ref([]); // Usar un arreglo para los ratings

const isLoading = ref(false);

// Función para capturar el rating de cada tema
const handleRateChange = (themeId, rating) => {
  // Buscar si ya existe un rating para este tema
  const index = ratings.value.findIndex(item => item.themeId === themeId);

  if (index !== -1) {
    // Si ya existe, actualizar el rating
    ratings.value[index].rating = rating;
  } else {
    // Si no existe, agregar el nuevo rating
    ratings.value.push({ themeId, rating });
  }
};

// Función para obtener los themes_id del evento y luego los detalles de los temas
const fetchEventThemes = async () => {

  const eventDocRef = doc(db, 'events', idEvent);

  try {
    const eventDocSnap = await getDoc(eventDocRef);
    if (eventDocSnap.exists()) {
      const themesIds = eventDocSnap.data().themes_id;
      isFreeEntrance.value = eventDocSnap.data().isFreeEntrance;

      // Para cada theme_id, obtenemos los detalles del tema
      const themeDocsPromises = themesIds.map(themeId => getDoc(doc(db, 'themes', themeId)));
      const themeDocs = await Promise.all(themeDocsPromises);

      themes.value = themeDocs
        .filter(themeDoc => themeDoc.exists())
        .map(themeDoc => ({ id: themeDoc.id, ...themeDoc.data() }))
        .filter(theme => theme.isActive) 
        .sort((a, b) => a.order - b.order);
      
      eventDescription.value = eventDocSnap.data().description;
    } else {
      console.error('No se encontró el evento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los detalles del evento:', error);
  }
};

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

// Función para actualizar los ratings al hacer clic en Checkout
const goToCheckout = async () => {
  isLoading.value = true;
  try {
    // Recorrer cada rating y actualizar el documento correspondiente en Firebase
    for (const { themeId, rating } of ratings.value) {
      const themeRef = doc(db, 'themes', themeId);
      const themeDoc = await getDoc(themeRef);
      
      if (themeDoc.exists()) {
        // Obtener el array de ratings actual y añadir el nuevo rating
        const currentRatings = themeDoc.data().ratings || [];
        currentRatings.push(rating);
        
        // Actualizar el documento con el nuevo array de ratings
        await updateDoc(themeRef, {
          ratings: currentRatings
        });
      }
    }
    if(isFreeEntrance.value) {
    // Una vez que se actualizan los ratings, redirigir al checkout
    router.push({
      name: 'Checkout',
      params: { idSpectator, idEvent, nameEvent },
      query: { referenceLink: route.query.referenceLink, idVisitor: route.query.idVisitor}
    });
  } else {
    router.push({
      name: 'ThankYou',
      query: { 
      idSpectator: idSpectator,
      referenceLink: route.query.referenceLink,
      idVisitor: route.query.idVisitor,
      idEvent: idEvent,
      paymentMethod: 'no payment',
      amount: 0
      }
    });
  }
  } catch (error) {
    console.error('Error al enviar los ratings:', error);
  }
  isLoading.value = false;
};

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

// Llamar a la función para obtener los datos cuando el componente se monte
onMounted(() => {
  spectatorParams.value = route.params.idSpectator;
  eventParams.value = route.params.idEvent;
  fetchSpectator();
  fetchEventThemes();
  generateRandomId();
});
</script>

<style>

.background-circle {
  background-image: url("../assets/gradient_bg.png");
}

</style>
