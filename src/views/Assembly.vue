<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <div class="flex flex-row items-center justify-between mb-10">
      <img src="../assets/logo_horizontal.png" width="150" />
      <router-link to="/" class="btn bg-white border-none">Volver</router-link>
    </div>
    <h1 class="justify-self-start text-2xl text-gray-900 font-bold mb-6">Nuestros integrantes</h1>
    
    <!-- Info de la formación/ensamble -->
    <div v-if="assemblyData" class="mb-8">
      <h2 class="text-xl font-semibold mb-2">{{ assemblyData.name }}</h2>
      <p class="mb-4">{{ assemblyData.description }}</p>
      <p v-if="assemblyData.type" class="text-sm text-gray-600">Tipo: {{ assemblyData.type }}</p>
    </div>

    <div v-if="isLoading" class="flex justify-center my-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <!-- Carrusel para los integrantes -->
    <div v-else-if="musicians.length > 0" class="relative w-full overflow-hidden">
      <div class="carousel carousel-center w-full rounded-box gap-4" id="membersCarousel">
        <!-- Cada integrante será un item del carrusel -->
        <div v-for="musician in musicians" :key="musician.id" class="carousel-item w-full max-w-md">
          <ThemeItem :theme="mapMusicianToTheme(musician)" />
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
    
    <div v-else class="my-8 alert alert-info">
      <p class="text-center w-full">No se encontraron integrantes activos.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import ThemeItem from '@/components/ThemeItem.vue';

// Estado para los datos
const assemblyData = ref(null);
const musicians = ref([]);
const carouselPosition = ref(0);
const isLoading = ref(true);

// Obtener datos del ensamble y sus músicos
const fetchAssemblyData = async () => {
  try {
    isLoading.value = true;
    console.log("Iniciando búsqueda de datos...");
    
    // Obtener todos los documentos de la colección assembly
    const assemblySnapshot = await getDocs(collection(db, 'assembly'));
    
    if (assemblySnapshot.empty) {
      console.error('No hay documentos en la colección assembly');
      isLoading.value = false;
      return;
    }
    
    console.log(`Se encontraron ${assemblySnapshot.docs.length} documentos en assembly`);
    
    // Tomar el primer documento de assembly (asumimos que solo hay uno)
    const assemblyDoc = assemblySnapshot.docs[0];
    const assemblyDataRaw = assemblyDoc.data();
    console.log("Datos del ensamble:", assemblyDataRaw);
    
    assemblyData.value = {
      id: assemblyDoc.id,
      ...assemblyDataRaw
    };
    
    // Obtener datos de los músicos activos
    const assemblyMembers = assemblyDataRaw.members || [];
    console.log(`Total de miembros en el ensamble: ${assemblyMembers.length}`);
    console.log("Miembros del ensamble:", assemblyMembers);
    
    // Usar todos los miembros ya que todos son activos
    const activeMembers = assemblyMembers;
    console.log(`Miembros activos: ${activeMembers.length}`);
    
    if (activeMembers.length === 0) {
      console.log('No hay integrantes en el ensamble');
      isLoading.value = false;
      return;
    }
    
    // Obtener detalles de cada músico de la colección musicians
    const musiciansData = [];
    
    for (const member of activeMembers) {
      console.log(`Procesando miembro con datos:`, member);
      
      if (!member.musicianId) {
        console.log('Miembro sin musicianId, saltando...');
        continue;
      }
      
      try {
        console.log(`Buscando músico con ID: ${member.musicianId}`);
        const musicianDoc = await getDoc(doc(db, 'musician', member.musicianId));
        
        if (musicianDoc.exists()) {
          const musicianData = musicianDoc.data();
          console.log(`Datos del músico ${member.musicianId}:`, musicianData);
          
          musiciansData.push({
            id: musicianDoc.id,
            ...musicianData,
            instrument: member.instrument // Usar el instrumento específico del miembro en este ensamble
          });
        } else {
          console.log(`No se encontró el músico con ID: ${member.musicianId}`);
        }
      } catch (musicianError) {
        console.error(`Error al obtener músico ${member.musicianId}:`, musicianError);
      }
    }
    
    console.log(`Total de músicos procesados: ${musiciansData.length}`);
    musicians.value = musiciansData;
    
    // Si no hay músicos con datos completos, mostrar datos básicos
    if (musiciansData.length === 0 && activeMembers.length > 0) {
      console.log("No se encontraron datos de músicos en la colección musician, usando datos básicos");
      musicians.value = activeMembers.map(member => ({
        id: member.musicianId || `temp-${Math.random().toString(36).substring(7)}`,
        name: "Músico",
        instrument: member.instrument || "Instrumento no especificado",
        background: "",
        instruments: [member.instrument].filter(Boolean)
      }));
    }
    
  } catch (error) {
    console.error('Error al obtener datos del ensamble:', error);
  } finally {
    isLoading.value = false;
  }
};

// Mapear datos del músico al formato que espera ThemeItem
const mapMusicianToTheme = (musician) => {
  return {
    id: musician.id,
    name: musician.name || 'Músico',
    artist: musician.instrument || (musician.instruments && musician.instruments.length > 0 ? musician.instruments[0] : 'Músico'),
    description: musician.background || '',
    topic: musician.instruments || [],
    imagePath: musician.photoPath || '',
    ratings: []
  };
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

// Manejar evento de scroll del carrusel
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

onMounted(() => {
  fetchAssemblyData();
  
  // Añadir listener para scroll del carrusel
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

<style scoped>
/* Asegurar que cada card del carrusel tenga un ancho máximo */
.carousel-item {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}
</style>