<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ nameEvent }}</h1>
    <div v-if="themes.length">
      <h2 class="text-xl font-semibold mb-4">Temas del evento:</h2>
      <ul>
        <li v-for="theme in themes" :key="theme.id" class="mb-4 p-4 border bg-white rounded-md">
          <ThemeItem :theme="theme" @onRateChange="handleRateChange"/>
        </li>
      </ul>
    </div>
    <p v-else class="text-red-500">Cargando detalles del evento y temas...</p>
    <button
      type="button"
      :disabled="isButtonDisabled"
      class="mt-2 inline-flex justify-center w-full items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="goToCheckout"
    >
      <span>Checkout</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import ThemeItem from '@/components/ThemeItem.vue';



const route = useRoute();
const router = useRouter();
const nameEvent = route.params.nameEvent;
const idEvent = route.params.idEvent;
const idSpectator = route.params.idSpectator;

const themes = ref([]);
const ratings = ref({}); // Guardar los ratings de cada tema

// Función para capturar el rating de cada tema
const handleRateChange = (themeId, rating) => {
  ratings.value[themeId] = rating;
};

// Función para obtener los themes_id del evento y luego los detalles de los temas
const fetchEventThemes = async () => {

  const eventDocRef = doc(db, 'events', idEvent);

  try {
    const eventDocSnap = await getDoc(eventDocRef);
    if (eventDocSnap.exists()) {
      const themesIds = eventDocSnap.data().themes_id;

      // Para cada theme_id, obtenemos los detalles del tema
      const themeDocsPromises = themesIds.map(themeId => getDoc(doc(db, 'themes', themeId)));
      const themeDocs = await Promise.all(themeDocsPromises);

      themes.value = themeDocs
        .filter(themeDoc => themeDoc.exists())
        .map(themeDoc => ({ id: themeDoc.id, ...themeDoc.data() }));
    } else {
      console.error('No se encontró el evento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los detalles del evento:', error);
  }
};

// Función para actualizar los ratings al hacer clic en Checkout
const goToCheckout = async () => {
  try {
    for (const [themeId, rating] of Object.entries(ratings.value)) {
      const themeRef = doc(db, 'themes', themeId);
      const themeDoc = await getDoc(themeRef);
      if (themeDoc.exists()) {
        const currentRatings = themeDoc.data().ratings || [];
        currentRatings.push(rating);
        await updateDoc(themeRef, { ratings: currentRatings });
      }
    }
    router.push({
      name: 'Checkout',
      params: { idSpectator, idEvent, nameEvent }
    });
  } catch (error) {
    console.error('Error al enviar los ratings:', error);
  }
};

// Llamar a la función para obtener los datos cuando el componente se monte
onMounted(fetchEventThemes);
</script>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
