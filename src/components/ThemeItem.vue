<template>
  <div>
      <div :class="openCollapse ? 'collapse-open' : ''" class="collapse border-base-300 bg-base-200 border rounded-xl">
        <div class="collapse-title text-xl font-medium flex items-center justify-between pr-1">
          <div class="flex gap-4 items-center">
            <img class="h-full w-16 sm:w-20 mt-4 sm:m-0" v-if="imageUrl" :src="imageUrl" alt="cover" />
            <div>
              <p class="w-full text-sm sm:text-base">
              {{ localTheme.name }}
              </p>
              <p class="text-xs sm:text-sm italic text-gray-500 font-thin">{{ localTheme.artist }}</p>
              <div class="flex items-center flex-wrap gap-4">
                <div class="flex items-center">
                  <StarIcon  v-for="star in 5" :key="star" @click="rateTheme(star)" class="cursor-pointer h-7 w-7" :class="star <= userRating ? 'text-yellow-500' : 'text-gray-300'"/>
                </div>
                <p class="text-xs text-gray-400"><span v-if="userRating !== 0"> Tu nota: {{ userRating }}</span></p>
              </div>
              <div v-for="(item, index) in localTheme.topic" :key="index" class="badge badge-neutral badge-xs border-none bg-gray-200 text-gray-600 p-2 font-thin mr-1">{{ item }}</div>
            </div>
          </div>
          <div class="flex items-center">
            <button v-if="localTheme.artist !== '' && localTheme.description !== ''" class="btn btn-active btn-link" @click="openCollapse = !openCollapse">
              <PlusCircleIcon v-if="!openCollapse" class="h-5 w-5"/>
              <MinusCircleIcon v-else class="h-5 w-5"/>
            </button>
            <div v-else class="min-w-28"></div>
          </div>
        </div>
        <div class="collapse-content">
          <div class="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4">
            <div class="my-4 flex flex-col gap-2">
              <p>{{ localTheme.description }}</p>
            </div>
          </div>
        </div>
      </div>
    <!-- <h2 class="text-xl font-semibold">{{ localTheme.name }}</h2>
    <div class="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4">
      <img class="h-full mt-4 sm:m-0" v-if="imageUrl" :src="imageUrl" alt="cover" width="100" />
      <div class="my-4 flex flex-col gap-2">
        <p><strong>{{ localTheme.artist }}</strong></p>
        <p>{{ localTheme.description }}</p>
        <div>
          <p class="text-xs"><strong>¿Cómo lo hemos tocado?</strong><span v-if="userRating !== 0"> Tu nota: {{ userRating }}</span></p>
          <div class="flex items-center">
          <StarIcon  v-for="star in 5" :key="star" @click="rateTheme(star)" class="cursor-pointer h-7 w-7" :class="star <= userRating ? 'text-yellow-500' : 'text-gray-300'"/>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';
// import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { StarIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/vue/24/solid'
import { storage } from '@/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';

const imageUrl = ref('');
const openCollapse = ref(false)

// Props que recibe el componente
// eslint-disable-next-line no-undef
const props = defineProps({
  theme: Object,  // El documento del tema que se va a mostrar
});

// Crear una copia local del tema para evitar mutar la prop directamente
const localTheme = ref({ ...props.theme });

const userRating = ref(0);

// Cálculo de la media de ratings
// const averageRating = computed(() => {
//   if (localTheme.value.ratings.length === 0) return 0;
//   return (localTheme.value.ratings.reduce((a, b) => a + b, 0) / localTheme.value.ratings.length).toFixed(1);
// });

// Emitir un evento cuando se cambie el rating
const emit = defineEmits(['onRateChange']);
const rateTheme = (rating) => {
  userRating.value = rating;
  emit('onRateChange', localTheme.value.id, rating); // Emitir evento al padre
};

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
  if (localTheme.value.imagePath) {
    fetchImageUrl(`gs://minutos-87fe9.appspot.com/${localTheme.value.imagePath}`);
  }
});

</script>

<style scoped>
/* Estilos adicionales */
</style>
