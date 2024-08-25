<template>
  <div>
    <h2 class="text-xl font-semibold">{{ localTheme.name }}</h2>
    <p><strong>Artist:</strong> {{ localTheme.artist }}</p>
    <p><strong>Description:</strong> {{ localTheme.description }}</p>
    <p><strong>Rating:</strong> {{ averageRating }} ({{ localTheme.ratings.length }} votos)</p>
    
    <div class="flex items-center mt-4">
      <!-- <span v-for="star in 5" :key="star" @click="rateTheme(star)" class="cursor-pointer"> -->
        <StarIcon v-for="star in 5" :key="star" @click="rateTheme(star)" class="cursor-pointer h-5 w-5" :class="star <= averageRating ? 'text-yellow-500' : 'text-gray-300'"/>
      <!-- </span> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { StarIcon } from '@heroicons/vue/24/solid'


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
    }
  } catch (error) {
    console.error('Error al agregar el rating: ', error);
  }
};
</script>

<style scoped>
/* Estilos adicionales */
</style>
