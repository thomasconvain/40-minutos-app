<template>
  <div class="w-full">
    <div class="card bg-base-200 shadow-lg rounded-xl w-full border border-base-300">
      <div class="card-body p-4 sm:p-6">
        <div class="flex gap-4 items-start mb-3">
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
          <div>
            <h2 class="card-title text-lg sm:text-xl font-bold">{{ musician?.name || 'Músico' }}</h2>
            <p class="text-xs sm:text-sm text-gray-500 mb-1">{{ musician?.instrument || 'Instrumento' }}</p>
            <div v-if="musician && musician.instruments && musician.instruments.length > 0" class="flex flex-wrap mt-1">
              <div v-for="(instrument, index) in musician.instruments" :key="index" class="badge badge-neutral badge-xs border-none bg-gray-200 text-gray-600 p-2 font-thin mr-1 mb-1">{{ instrument }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="musician && musician.background" class="mt-2 text-sm sm:text-base text-gray-700">
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

// Props que recibe el componente
// eslint-disable-next-line no-undef
const props = defineProps({
  musician: Object,  // El músico que se va a mostrar
});

const imageUrl = ref('');

// Función para obtener la URL de la imagen
const fetchImageUrl = async (path) => {
  try {
    const imageRef = storageRef(storage, path);
    imageUrl.value = await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error al obtener la URL de la imagen:', error);
  }
}

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