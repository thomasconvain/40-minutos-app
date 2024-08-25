<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Perfil del Usuario</h1>
    <div v-if="spectator">
      <p><strong>Nombre:</strong> {{ spectator.name }}</p>
      <p><strong>Email:</strong> {{ spectator.email }}</p>
      <p><strong>Teléfono:</strong> {{ spectator.phone }}</p>
      <p><strong>Estás inscrito para los siguientes eventos. Muestra esa pantalla en el ingreso.</strong></p>
      <ul v-if="events.length">
        <li v-for="event in events" :key="event.id" class="mb-4 p-4 border rounded-md">
          <h2 class="text-lg font-semibold">{{ event.name }}</h2>
          <p><strong>Lugar:</strong> {{ event.place }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(event.date) }}</p>
          <button
            class="mt-2 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            @click="goToEvent(event)"
          >
            Ver detalles del evento
          </button>
        </li>
      </ul>
      <p v-else class="text-red-500">Cargando detalles de los eventos...</p>
    </div>
    <p v-else class="text-red-500">Cargando datos del espectador...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, collection } from 'firebase/firestore';

// Obtener el ID del espectador desde la ruta
const route = useRoute();
const id = route.params.id;

// Variables reactivas para almacenar los datos del espectador y los eventos
const spectator = ref(null);
const events = ref([]);
const router = useRouter(); // Instancia de Vue Router

// Función para obtener los datos del espectador desde Firestore
const fetchSpectator = async () => {
  const db = getFirestore();
  const docRef = doc(db, 'spectators', id);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
      await fetchEvents(spectator.value['subscribed_events_id']);
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos del espectador:', error);
  }
};

// Función para obtener los detalles de los eventos usando los IDs
const fetchEvents = async (eventIds) => {
  const db = getFirestore();
  const eventsCollection = collection(db, 'events');

  try {
    // Para cada ID de evento, obtenemos el documento correspondiente
    const eventDocsPromises = eventIds.map(eventId => getDoc(doc(eventsCollection, eventId)));
    const eventDocs = await Promise.all(eventDocsPromises);

    // Mapeamos los resultados válidos en la variable `events`
    events.value = eventDocs
      .filter(eventDoc => eventDoc.exists())
      .map(eventDoc => ({ id: eventDoc.id, ...eventDoc.data() }));
  } catch (error) {
    console.error('Error al obtener los detalles de los eventos:', error);
  }
};

// Función para formatear la fecha
const formatDate = (timestamp) => {
  const date = timestamp.toDate();
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Función para navegar a la página del evento
const goToEvent = (event) => {
  router.push({
    name: 'EventDetail',
    params: { idSpectator: id, idEvent: event.id, nameEvent: event.name },
  });
};

// Llamar a la función para obtener los datos cuando el componente se monte
onMounted(fetchSpectator);
</script>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
