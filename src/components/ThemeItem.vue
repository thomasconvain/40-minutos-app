<template>
  <div>
    <h2 class="text-xl font-semibold">{{ localTheme.name }}</h2>
    <div class="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-4">
      <img class="h-full mt-4 sm:m-0" v-if="imageUrl" :src="imageUrl" alt="cover" width="100" />
      <div class="my-4 flex flex-col gap-2">
        <p><strong>Artista:</strong> {{ localTheme.artist }}</p>
        <p><strong>Descripción:</strong> {{ localTheme.description }}</p>
        <div>
          <p><strong>¿Cómo lo hemos toccado?:</strong> {{ averageRating }} ({{ localTheme.ratings.length }} votos)</p>
          <div class="flex items-center">
        <!-- <span v-for="star in 5" :key="star" @click="rateTheme(star)" class="cursor-pointer"> -->
          <StarIcon v-for="star in 5" :key="star" @click="rateTheme(star)" class="cursor-pointer h-7 w-7" :class="star <= averageRating ? 'text-yellow-500' : 'text-gray-300'"/>
        <!-- </span> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { StarIcon } from '@heroicons/vue/24/solid'
import { storage } from '@/firebase';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';

const imageUrl = ref('');

// Props que recibe el componente
// eslint-disable-next-line no-undef
const props = defineProps({
  theme: Object,  // El documento del tema que se va a mostrar
});

// Crear una copia local del tema para evitar mutar la prop directamente
const localTheme = ref({ ...props.theme });

// Cálculo de la media de ratings
const averageRating = computed(() => {
  if (localTheme.value.ratings.length === 0) return 0;
  return (localTheme.value.ratings.reduce((a, b) => a + b, 0) / localTheme.value.ratings.length).toFixed(1);
});

// Método para agregar un nuevo rating
const rateTheme = async (rating) => {
  const db = getFirestore();
  const themeRef = doc(db, 'themes', localTheme.value.id);

  try {
    // Obtener el documento actual
    const themeDoc = await getDoc(themeRef);
    if (themeDoc.exists()) {
      // Obtener el array de ratings actual y añadir el nuevo rating
      const currentRatings = themeDoc.data().ratings || [];
      currentRatings.push(rating);

      // Actualizar el documento con el nuevo array de ratings
      await updateDoc(themeRef, {
        ratings: currentRatings,
      });

      // Actualizar la copia local del tema para reflejar el nuevo rating
      localTheme.value.ratings.push(rating);
    } else {
      console.error('El documento no existe.');
    }
  } catch (error) {
    console.error('Error al agregar el rating:', error);
  }
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
