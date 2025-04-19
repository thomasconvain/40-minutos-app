<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <button class="btn bg-white border-none" @click="$router.go(-1)">Volver</button>
    </div>
    <h1 class="text-2xl font-bold mb-6">{{ nameEvent }}</h1>
    <p class="mb-6">{{ eventDescription }}</p>
    
    <div class="tabs-boxed mb-4">
      <div role="tablist" class="tabs tabs-lifted">
        <a role="tab" class="tab" :class="{ 'tab-active bg-gray-200': activeTab === 'programa' }" @click="activeTab = 'programa'">
          <DocumentTextIcon class="h-5 w-5 mr-1" aria-hidden="true" />
          Programa
        </a>
        <a role="tab" class="tab" :class="{ 'tab-active bg-base-200': activeTab === 'interpretes' }" @click="activeTab = 'interpretes'">
          <UserGroupIcon class="h-5 w-5 mr-1" aria-hidden="true" />
          Intérpretes
        </a>
      </div>
    </div>
    
    <!-- Contenido de la pestaña "Programa" -->
    <div v-if="activeTab === 'programa'">
      <div v-if="themes.length">
        <div class="my-4" v-if="spectator.numberOfPeople > 1">
          <div class="alert alert-info rounded-none">
            <span class="text-xs">Comparte al link del programa del concierto a tu grupo para que puedan seguir con la experiencia en sus propios dispositivos</span>
          </div>
          <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/event/${spectatorParams}/${eventParams}/?referenceLink=true%26idVisitor=visitor-${randomId}`'>
            <button class="btn btn-active mt-2 w-full"><ShareIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Compartir link</button>
          </a>
        </div>
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
    </div>
    
    <!-- Contenido de la pestaña "Intérpretes" -->
    <div v-if="activeTab === 'interpretes'" class="mt-4">
      <div v-if="isLoadingMusicians" class="flex justify-center my-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div v-else-if="musicians.length > 0">
        <div v-for="musician in musicians" :key="musician.id" class="mb-4">
          <MusicianCard :musician="musician" />
        </div>
      </div>
      <div v-else class="alert alert-info">
        <span>No hay información disponible sobre los intérpretes.</span>
      </div>
    </div>
    
    <div v-if="activeTab === 'programa' && ratings.length !== themes.length" class="alert alert-info rounded-none mt-4">
      <InformationCircleIcon class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
      <span class="text-xs">Parece que no evaluaste todas las obras que hemos tocado. Nos encantaría conocer tu opinión antes de continuar. 🤓</span>
    </div>
    
    <button
      v-if="activeTab === 'programa'"
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
import { doc, getDoc, updateDoc, getFirestore, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import ThemeItem from '@/components/ThemeItem.vue';
import MusicianCard from '@/components/MusicianCard.vue';
import { InformationCircleIcon, ShareIcon, DocumentTextIcon, UserGroupIcon } from '@heroicons/vue/24/outline'


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
const spectatorsShouldPayInTheApp = ref(true);
const activeTab = ref('programa'); // Para controlar las pestañas

const themes = ref([]);
const ratings = ref([]); // Usar un arreglo para los ratings
const musicians = ref([]);
const isLoading = ref(false);
const isLoadingMusicians = ref(false);
const isButtonDisabled = ref(false);

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
      const eventData = eventDocSnap.data();
      const themesIds = eventData.themes_id;
      spectatorsShouldPayInTheApp.value = eventData.spectatorsShouldPayInTheApp;
      
      // Obtener datos del content-manager si existe contentReferenceId
      if (eventData.contentReferenceId) {
        try {
          const contentRef = doc(db, 'content-manager', eventData.contentReferenceId);
          const contentSnap = await getDoc(contentRef);
          
          if (contentSnap.exists()) {
            const contentData = contentSnap.data();
            // Obtener la descripción del evento desde content-manager
            if (contentData.event && contentData.event.description) {
              eventDescription.value = contentData.event.description;
            } else {
              // Fallback a la descripción actual si no existe en content-manager
              eventDescription.value = eventData.description || '';
            }
          } else {
            eventDescription.value = eventData.description || '';
          }
        } catch (contentError) {
          console.error('Error al obtener datos de content-manager:', contentError);
          eventDescription.value = eventData.description || '';
        }
      } else {
        // Si no hay contentReferenceId, usar la descripción directamente del evento
        eventDescription.value = eventData.description || '';
      }

      // Para cada theme_id, obtenemos los detalles del tema
      const themeDocsPromises = themesIds.map(themeId => getDoc(doc(db, 'themes', themeId)));
      const themeDocs = await Promise.all(themeDocsPromises);

      themes.value = themeDocs
        .filter(themeDoc => themeDoc.exists())
        .map(themeDoc => ({ id: themeDoc.id, ...themeDoc.data() }))
        .filter(theme => theme.isActive) 
        .sort((a, b) => a.order - b.order);
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
    if(spectatorsShouldPayInTheApp.value) {
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

// Función para obtener los músicos
const fetchMusicians = async () => {
  isLoadingMusicians.value = true;
  try {
    // Obtener datos del ensamble para conseguir la lista de músicos
    const assemblySnapshot = await getDocs(collection(db, 'assembly'));
    
    if (!assemblySnapshot.empty) {
      const assemblyDoc = assemblySnapshot.docs[0];
      const assemblyData = assemblyDoc.data();
      const assemblyMembers = assemblyData.members || [];
      
      // Obtener detalles de cada músico
      const musiciansData = [];
      
      for (const member of assemblyMembers) {
        if (member.musicianId) {
          try {
            const musicianDoc = await getDoc(doc(db, 'musicians', member.musicianId));
            
            if (musicianDoc.exists()) {
              const musicianData = musicianDoc.data();
              
              musiciansData.push({
                id: musicianDoc.id,
                ...musicianData,
                instrument: member.instrument // Instrumento específico en este ensamble
              });
            }
          } catch (error) {
            console.error(`Error al obtener músico:`, error);
          }
        }
      }
      
      musicians.value = musiciansData;
    }
  } catch (error) {
    console.error('Error al obtener datos de músicos:', error);
  } finally {
    isLoadingMusicians.value = false;
  }
};

// Llamar a la función para obtener los datos cuando el componente se monte
onMounted(() => {
  spectatorParams.value = route.params.idSpectator;
  eventParams.value = route.params.idEvent;
  fetchSpectator();
  fetchEventThemes();
  fetchMusicians();
  generateRandomId();
});
</script>

<style>
.background-circle {
  background-image: url("../assets/gradient_bg.png");
}

/* Estilos personalizados para las pestañas */
.tabs-lifted .tab-active {
  background-color: rgba(209, 213, 219, 0.7) !important; /* gris medio oscuro con transparencia */
  color: #000000 !important; /* texto negro */
  font-weight: 500 !important; /* semi-bold */
}

/* Para asegurarse que el contenido del tab tenga el mismo fondo */
.tab-active + .tab-content {
  background-color: rgba(209, 213, 219, 0.7) !important;
}
</style>
