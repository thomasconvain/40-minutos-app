<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <button class="btn btn-square rounded-lg bg-white border-none" @click="$router.go(-1)">
        <HomeIcon class="h-5 w-5" aria-hidden="true" />
      </button>
      
      <!-- Botón de compartir link con tooltip -->
      <div v-if="spectator && spectator.numberOfPeople > 1" class="tooltip tooltip-left" data-tip="Comparte el link del programa del concierto a tu grupo">
        <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/event/${spectatorParams}/${eventParams}/?referenceLink=true%26idVisitor=visitor-${randomId}`'>
          <button class="btn btn-outline btn-ghost btn-sm rounded-full">
            <ShareIcon class="h-4 w-4 mr-1" aria-hidden="true" />
            Compartir
          </button>
        </a>
      </div>
    </div>
    <h1 class="text-2xl font-bold mb-6">{{ nameEvent }}</h1>
    <p class="mb-4">{{ eventDescription }}</p>
    
    <div class="flex w-full bg-gray-200/70 rounded-lg p-2 mb-3">
      <InformationCircleIcon class="h-5 w-5 mr-2 flex-shrink-0" aria-hidden="true" />
      <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full">
        <span class="text-xs">Recuerda finalizar el proceso con checkout</span>
        <a v-if="activeTab !== 'programa'" href="#" @click.prevent="activeTab = 'programa'" class="text-xs font-semibold underline mt-1 sm:mt-0">Ir al checkout</a>
      </div>
    </div>
    
    <div class="tabs-boxed mb-4">
      <div role="tablist" class="tabs tabs-lifted tab-container">
        <a role="tab" class="tab tab-responsive" :class="{ 'tab-active bg-gray-200': activeTab === 'programa' }" @click="activeTab = 'programa'">
          <DocumentTextIcon class="tab-icon" aria-hidden="true" />
          <span>Obras</span>
        </a>
        <a role="tab" class="tab tab-responsive" :class="{ 'tab-active bg-base-200': activeTab === 'interpretes' }" @click="activeTab = 'interpretes'">
          <UserGroupIcon class="tab-icon" aria-hidden="true" />
          <span>Intérpretes</span>
        </a>
        <a role="tab" class="tab tab-responsive" :class="{ 'tab-active bg-base-200': activeTab === 'capitulo' }" @click="activeTab = 'capitulo'">
          <BookOpenIcon class="tab-icon" aria-hidden="true" />
          <span>Capítulo</span>
        </a>
      </div>
    </div>
    
    <!-- Contenido de la pestaña "Obras" -->
    <div v-if="activeTab === 'programa'">
      <div v-if="themes.length">
        <ul>
          <li v-for="theme in themes" :key="theme.id" class="mb-4 bg-white rounded-md">
            <ThemeItem 
              :theme="theme" 
              :initialRating="getThemeRating(theme.id)"
              @onRateChange="handleRateChange"
            />
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
      <div v-else-if="musicians.length > 0" class="relative w-full overflow-hidden">
        <!-- Info del ensamble si está disponible -->
        <div v-if="assemblyData" class="mb-8">
          <div :class="assemblyDescriptionOpen ? 'collapse-open' : ''" class="collapse bg-white rounded-xl shadow-sm">
            <div class="collapse-title text-xl font-medium flex items-center justify-between pr-1">
              <div>
                <p class="w-full text-base sm:text-lg font-medium">
                  {{ assemblyData.name }}
                </p>
                <div class="flex items-center flex-wrap gap-4 mt-2">
                  <div class="flex items-center">
                    <StarIcon v-for="star in 5" :key="star" @click="rateAssembly(star)" class="cursor-pointer h-5 w-5" :class="star <= assemblyRating ? 'text-yellow-500' : 'text-gray-300'"/>
                  </div>
                  <p class="text-xs text-gray-400"><span v-if="assemblyRating !== 0"> Tu nota: {{ assemblyRating }}</span></p>
                </div>
              </div>
              <div class="flex items-center">
                <button v-if="assemblyData.description" class="btn btn-active btn-link" @click="assemblyDescriptionOpen = !assemblyDescriptionOpen">
                  <PlusCircleIcon v-if="!assemblyDescriptionOpen" class="h-5 w-5"/>
                  <MinusCircleIcon v-else class="h-5 w-5"/>
                </button>
                <div v-else class="min-w-28"></div>
              </div>
            </div>
            <div class="collapse-content">
              <div class="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4">
                <div class="my-4 flex flex-col gap-2">
                  <p>{{ assemblyData.description || 'No hay descripción disponible' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Carrusel para los integrantes -->
        <div class="carousel carousel-center w-full rounded-box gap-4" id="membersCarousel">
          <!-- Cada integrante será un item del carrusel -->
          <div v-for="musician in musicians" :key="musician.id" class="carousel-item w-full">
            <MusicianCard 
              :musician="musician" 
              :initialRating="getMusicianRating(musician.id)"
              @rateChange="handleMusicianRating" 
            />
          </div>
        </div>
        
        <!-- Botones de navegación para el carrusel -->
        <div v-if="musicians.length > 1" class="flex justify-center mt-4 gap-3">
          <button 
            class="btn btn-circle btn-sm" 
            :class="{'btn-primary': carouselPosition > 0, 'opacity-50': carouselPosition === 0}"
            :disabled="carouselPosition === 0"
            @click="scrollCarousel('prev')"
          >❮</button>
          <button 
            class="btn btn-circle btn-sm" 
            :class="{'btn-primary': carouselPosition < musicians.length - 1, 'opacity-50': carouselPosition >= musicians.length - 1}"
            :disabled="carouselPosition >= musicians.length - 1"
            @click="scrollCarousel('next')"
          >❯</button>
        </div>
      </div>
      <div v-else class="alert alert-info">
        <span>No hay información disponible sobre los intérpretes.</span>
      </div>
    </div>
    
    <!-- Contenido de la pestaña "Capítulo" -->
    <div v-if="activeTab === 'capitulo'" class="mt-4">
      <div v-if="isLoadingChapter" class="flex justify-center my-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div v-else-if="chapterData" class="mb-8">
        <div :class="chapterDescriptionOpen ? 'collapse-open' : ''" class="collapse bg-white rounded-xl shadow-sm">
          <div class="collapse-title text-xl font-medium flex items-center justify-between pr-1">
            <div>
              <p class="w-full text-base sm:text-lg font-medium">
                {{ chapterData.title || 'Capítulo del concierto' }}
              </p>
              <div class="flex items-center mt-1">
                <StarIcon v-for="star in 5" :key="star" @click="rateChapter(star)" class="cursor-pointer h-5 w-5" :class="star <= chapterRating ? 'text-yellow-500' : 'text-gray-300'"/>
                <p class="text-xs text-gray-400 ml-2"><span v-if="chapterRating !== 0"> Tu nota: {{ chapterRating }}</span></p>
              </div>
              <p class="text-sm text-gray-600 mt-2">{{ chapterData.synopsis }}</p>
            </div>
            <div class="flex items-center" v-if="chapterData.description">
              <button class="btn btn-active btn-link" @click="chapterDescriptionOpen = !chapterDescriptionOpen">
                <PlusCircleIcon v-if="!chapterDescriptionOpen" class="h-5 w-5"/>
                <MinusCircleIcon v-else class="h-5 w-5"/>
              </button>
            </div>
          </div>
          <div class="collapse-content">
            <div class="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4">
              <div class="my-4 flex flex-col gap-2">
                <p>{{ chapterData.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Capítulo del concierto</h2>
          <p class="text-gray-500">Información del capítulo no disponible para este concierto.</p>
        </div>
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, updateDoc, getFirestore, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import ThemeItem from '@/components/ThemeItem.vue';
import MusicianCard from '@/components/MusicianCard.vue';
import { InformationCircleIcon, ShareIcon, DocumentTextIcon, UserGroupIcon, BookOpenIcon, HomeIcon } from '@heroicons/vue/24/outline'
import { PlusCircleIcon, MinusCircleIcon, StarIcon } from '@heroicons/vue/24/solid'


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

// Observar cambios en activeTab para asegurar que las evaluaciones estén actualizadas al cambiar de pestaña
watch(activeTab, () => {
  // Al cambiar de pestaña, asegurarse de que las evaluaciones estén actualizadas
  loadExistingRatings();
});

const themes = ref([]);
const ratings = ref([]); // Usar un arreglo para los ratings
const musicians = ref([]);
const musiciansRatings = ref([]); // Arreglo para los ratings de músicos
const assemblyData = ref(null);
const carouselPosition = ref(0);
const chapterData = ref(null);
const chapterDescriptionOpen = ref(false);
const chapterRating = ref(0);
const isLoading = ref(false);
const isLoadingMusicians = ref(false);
const isLoadingChapter = ref(false);
const isButtonDisabled = ref(false);
const assemblyDescriptionOpen = ref(false);
const assemblyRating = ref(0);

// Función para capturar el rating de cada tema
const handleRateChange = async (themeId, rating) => {
  // Buscar si ya existe un rating para este tema
  const index = ratings.value.findIndex(item => item.themeId === themeId);

  if (index !== -1) {
    // Si ya existe, actualizar el rating
    ratings.value[index].rating = rating;
  } else {
    // Si no existe, agregar el nuevo rating
    ratings.value.push({ themeId, rating });
  }
  
  // Guardar inmediatamente la evaluación para que persista entre cambios de tab
  await saveSpectatorRatings();
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
      
      // Obtener datos del capítulo si existe chapterId
      if (eventData.chapterId) {
        fetchChapterData(eventData.chapterId);
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
    
    // Guardar todas las evaluaciones del espectador en el eventSpectator
    await saveSpectatorRatings();
    
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

// Función para guardar todas las evaluaciones del espectador
const saveSpectatorRatings = async () => {
  try {
    // Obtener el documento del evento para encontrar el spectator específico
    const eventRef = doc(db, 'events', idEvent);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      console.error('No se encontró el evento');
      return;
    }
    
    const eventData = eventDoc.data();
    const eventSpectators = eventData.eventSpectators || [];
    
    // Buscar el espectador actual en el array
    const spectatorIndex = eventSpectators.findIndex(s => s.id === idSpectator);
    
    if (spectatorIndex === -1) {
      console.error('No se encontró el espectador en el evento');
      return;
    }
    
    // Crear objeto de ratings consolidado
    const spectatorRatings = {
      themes: ratings.value.map(item => ({ id: item.themeId, rating: item.rating })),
      assembly: assemblyRating.value > 0 ? assemblyRating.value : null,
      chapter: chapterRating.value > 0 ? chapterRating.value : null,
      musicians: musiciansRatings.value.map(item => ({ id: item.musicianId, rating: item.rating }))
    };
    
    // Actualizar el eventSpectator con todas las calificaciones
    eventSpectators[spectatorIndex] = {
      ...eventSpectators[spectatorIndex],
      ratings: spectatorRatings,
      ratedAt: new Date().toISOString()
    };
    
    // Guardar los cambios en el documento del evento
    await updateDoc(eventRef, {
      eventSpectators: eventSpectators
    });
    
    console.log('Evaluaciones guardadas con éxito');
  } catch (error) {
    console.error('Error al guardar las evaluaciones:', error);
  }
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
      const assemblyDataRaw = assemblyDoc.data();
      
      // Guardar los datos del ensamble
      assemblyData.value = {
        id: assemblyDoc.id,
        ...assemblyDataRaw
      };
      
      const assemblyMembers = assemblyDataRaw.members || [];
      
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

// Función para desplazar el carrusel
const scrollCarousel = (direction) => {
  const carousel = document.getElementById('membersCarousel');
  if (!carousel) return;
  
  const scrollAmount = direction === 'next' ? carousel.offsetWidth : -carousel.offsetWidth;
  carousel.scrollBy({left: scrollAmount, behavior: 'smooth'});
  
  // Actualizar la posición
  if (direction === 'next') {
    carouselPosition.value++;
  } else {
    carouselPosition.value--;
  }
};


// Función para calificar el ensamble
const rateAssembly = async (rating) => {
  assemblyRating.value = rating;
  // Guardar inmediatamente la evaluación para que persista entre cambios de tab
  await saveSpectatorRatings();
};

// Función para calificar el capítulo
const rateChapter = async (rating) => {
  chapterRating.value = rating;
  // Guardar inmediatamente la evaluación para que persista entre cambios de tab
  await saveSpectatorRatings();
};

// Función para manejar la calificación de músicos
const handleMusicianRating = async (musicianId, rating) => {
  // Buscar si ya existe un rating para este músico
  const index = musiciansRatings.value.findIndex(item => item.musicianId === musicianId);
  
  if (index !== -1) {
    // Si ya existe, actualizar el rating
    musiciansRatings.value[index].rating = rating;
  } else {
    // Si no existe, agregar el nuevo rating
    musiciansRatings.value.push({ musicianId, rating });
  }
  
  // Guardar inmediatamente la evaluación para que persista entre cambios de tab
  await saveSpectatorRatings();
};

// Función para obtener la calificación de un músico específico
const getMusicianRating = (musicianId) => {
  const ratingItem = musiciansRatings.value.find(item => item.musicianId === musicianId);
  return ratingItem ? ratingItem.rating : 0;
};

// Función para obtener la calificación de un tema específico
const getThemeRating = (themeId) => {
  const ratingItem = ratings.value.find(item => item.themeId === themeId);
  return ratingItem ? ratingItem.rating : 0;
};

// Función para obtener los datos del capítulo
const fetchChapterData = async (chapterId) => {
  if (!chapterId) return;
  
  isLoadingChapter.value = true;
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterSnap = await getDoc(chapterRef);
    
    if (chapterSnap.exists()) {
      const data = chapterSnap.data();
      chapterData.value = {
        id: chapterId,
        title: data.title || 'Capítulo del concierto',
        synopsis: data.synopsis || '',
        description: data.description || ''
      };
    } else {
      console.log('No se encontró el capítulo con ID:', chapterId);
      chapterData.value = null;
    }
  } catch (error) {
    console.error('Error al obtener datos del capítulo:', error);
    chapterData.value = null;
  } finally {
    isLoadingChapter.value = false;
  }
};

// Función para manejar el evento de scroll del carrusel
const handleCarouselScroll = () => {
  const carousel = document.getElementById('membersCarousel');
  if (!carousel) return;
  
  // Calcular la posición actual basada en el desplazamiento
  const scrollLeft = carousel.scrollLeft;
  const itemWidth = carousel.offsetWidth;
  const newPosition = Math.round(scrollLeft / itemWidth);
  
  // Actualizar la posición solo si ha cambiado
  if (newPosition !== carouselPosition.value) {
    carouselPosition.value = newPosition;
  }
};

// Cargar evaluaciones existentes del espectador 
const loadExistingRatings = async () => {
  try {
    const eventRef = doc(db, 'events', idEvent);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      console.error('No se encontró el evento');
      return;
    }
    
    const eventData = eventDoc.data();
    const eventSpectators = eventData.eventSpectators || [];
    
    // Buscar el espectador actual en el array
    const spectator = eventSpectators.find(s => s.id === idSpectator);
    
    if (!spectator || !spectator.ratings) return;
    
    // Cargar las calificaciones guardadas
    if (spectator.ratings.themes) {
      ratings.value = spectator.ratings.themes.map(item => ({ 
        themeId: item.id, 
        rating: item.rating 
      }));
    }
    
    if (spectator.ratings.musicians) {
      musiciansRatings.value = spectator.ratings.musicians.map(item => ({
        musicianId: item.id,
        rating: item.rating
      }));
    }
    
    if (spectator.ratings.assembly) {
      assemblyRating.value = spectator.ratings.assembly;
    }
    
    if (spectator.ratings.chapter) {
      chapterRating.value = spectator.ratings.chapter;
    }
    
    console.log('Evaluaciones cargadas con éxito');
  } catch (error) {
    console.error('Error al cargar evaluaciones:', error);
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
  loadExistingRatings();
  
  // Añadir listener para scroll del carrusel cuando se active la pestaña de intérpretes
  setTimeout(() => {
    const carousel = document.getElementById('membersCarousel');
    if (carousel) {
      carousel.addEventListener('scroll', handleCarouselScroll);
    }
  }, 1000); // Dar tiempo a que el DOM se actualice
});

// Limpiar event listeners cuando el componente se destruya
onBeforeUnmount(() => {
  const carousel = document.getElementById('membersCarousel');
  if (carousel) {
    carousel.removeEventListener('scroll', handleCarouselScroll);
  }
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

/* Contenedor de tabs para que todos tengan el mismo tamaño */
.tab-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
}

/* Estilos para los tabs responsivos */
.tab-responsive {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: auto !important;
  min-height: 3rem;
  padding: 0.75rem 0.5rem !important;
  text-align: center;
  flex: 1;
}

.tab-icon {
  height: 1.25rem;
  width: 1.25rem;
  margin-bottom: 0.25rem;
}

/* Para pantallas más grandes */
@media (min-width: 640px) {
  .tab-responsive {
    flex-direction: row;
    padding: 0.5rem 1rem !important;
    justify-content: center;
  }
  
  .tab-icon {
    margin-bottom: 0;
    margin-right: 0.375rem;
  }
}

/* Tooltip personalizado */
.tooltip::before {
  background-color: #4B5563 !important; /* gris medio */
  color: white !important;
  font-size: 0.75rem !important;
  max-width: 15rem !important;
  padding: 0.5rem !important;
  z-index: 999 !important;
  white-space: normal !important;
  text-align: left !important;
  line-height: 1.25 !important;
}

.tooltip::after {
  background-color: #4B5563 !important;
  z-index: 999 !important;
}

/* Asegurar que cada card del carrusel tenga un ancho adecuado */
.carousel-item {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}
</style>
