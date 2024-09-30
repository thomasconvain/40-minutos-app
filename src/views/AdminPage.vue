<template>
  <div>
    <h1>Total de personas registradas</h1>
    <p>El total de personas es: {{ totalNumberOfPeople }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de tener configurada tu instancia de Firebase

const totalNumberOfPeople = ref(0);

const fetchSpectators = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'spectators'));
    let total = 0;
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.numberOfPeople) {
        total += data.numberOfPeople;
      }
    });

    totalNumberOfPeople.value = total;
  } catch (error) {
    console.error('Error obteniendo los documentos: ', error);
  }
};

onMounted(() => {
  fetchSpectators();
});
</script>
