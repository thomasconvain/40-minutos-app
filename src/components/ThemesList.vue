<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Temas para este concierto:</h1>
    <ul>
      <li v-for="theme in themes" :key="theme.id" class="mb-4 p-4 border border-gray-200 rounded-lg">
        <ThemeItem :theme="theme" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ThemeItem from '@/components/ThemeItem.vue';

const themes = ref([]);

const fetchThemes = async () => {
  const themesCollection = query(collection(db, 'themes'), where('isActive', '==', true));
  const themesSnapshot = await getDocs(themesCollection);
  themes.value = themesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

onMounted(fetchThemes);

</script>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
