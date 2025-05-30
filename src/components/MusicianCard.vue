<template>
  <div class="w-full">
    <div :class="isOpen ? 'collapse-open' : ''" class="collapse border border-gray-200 rounded-xl shadow-sm">
      <div class="collapse-title p-4 sm:p-6">
        <div class="flex gap-4 items-start">
          <div class="w-20 sm:w-28 h-20 sm:h-28 flex-shrink-0">
            <img 
              v-if="imageUrl" 
              :src="imageUrl" 
              alt="Foto del músico" 
              class="w-full h-full object-cover rounded shadow-sm"
            />
            <div v-else class="w-full h-full bg-gray-200 rounded shadow-sm flex items-center justify-center">
              <span class="text-gray-400 text-xs">Sin foto</span>
            </div>
          </div>
          <div class="flex-grow">
            <div class="flex justify-between items-start w-full">
              <div class="pr-10 flex-1 relative">
                <h2 class="text-sm sm:text-xl font-bold pr-6">{{ musician?.name || 'Músico' }}</h2>
                <div class="flex items-center">
                  <StarIcon v-for="star in 5" :key="star" @click="rateMusicianPerformance(star)" class="cursor-pointer h-5 w-5" :class="star <= musicianRating ? 'text-yellow-500' : 'text-gray-300'"/>
                </div>
                <div class="flex items-center flex-wrap gap-4 mt-1">
                  <p class="text-xs text-gray-400"><span v-if="musicianRating !== 0"> Tu nota: {{ musicianRating }}</span></p>
                </div>
                
                <div v-if="musician && musician.instruments && musician.instruments.length > 0" class="flex flex-wrap mt-1">
                  <div v-for="(instrument, index) in musician.instruments" :key="index" class="badge badge-neutral badge-xs border-none bg-gray-200 text-gray-600 p-2 font-thin mr-1 mb-1">{{ instrument }}</div>
                </div>
                
                <div v-if="musician && musician.background" class="mt-2 text-left">
                  <button class="btn btn-sm btn-link text-xs px-0 justify-start" @click.stop="isOpen = !isOpen">
                    <span v-if="!isOpen">Ver reseña</span>
                    <span v-else>Ocultar reseña</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="collapse-content px-4 sm:px-6"> 
        <div v-if="musician && musician.background" class="text-sm sm:text-base text-gray-700 pb-4">
          <p>{{ musician.background }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storage } from '@/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { StarIcon } from '@heroicons/vue/24/solid';

// Props que recibe el componente
// eslint-disable-next-line no-undef
const props = defineProps({
  musician: Object,  // El músico que se va a mostrar
  initialRating: {
    type: Number,
    default: 0
  }
});

// Emisión de eventos
const emit = defineEmits(['rateChange']);

const imageUrl = ref('');
const isOpen = ref(false);
const musicianRating = ref(props.initialRating);

// Función para obtener la URL de la imagen
const fetchImageUrl = async (path) => {
  try {
    const imageRef = storageRef(storage, path);
    imageUrl.value = await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error al obtener la URL de la imagen:', error);
  }
}

// Función para calificar al músico
const rateMusicianPerformance = (rating) => {
  musicianRating.value = rating;
  // Emitir el evento al componente padre
  emit('rateChange', props.musician.id, rating);
};

// Llamar a la función para obtener la URL cuando el componente se monte
onMounted(() => {
  // Verificar si existe photoPath o imagePath
  const imagePath = props.musician?.photoPath || props.musician?.imagePath;
  if (imagePath) {
    fetchImageUrl(`gs://minutos-87fe9.appspot.com/${imagePath}`);
  }
});
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>