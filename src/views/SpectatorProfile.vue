<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Hola {{ spectator?.name }} 👋</h1>
    <p>Gracias por inscribirte a uno de nuestros eventos.<br>
      Por favor muestra esa pantalla antes de ingresar al recinto.</p>
    <div class="mt-4" v-if="spectator">
      <p class="my-4"><strong>Estás inscrito para los siguientes eventos:</strong></p>
      <div v-if="events.length">
        <div v-for="event in events" :key="event.id" class="card bg-base-100 border border-base-600">
          <div class="card-body">
            <h2 class="card-title">{{ event.name }}</h2>
            <p><strong>Lugar:</strong> {{ event.place }}</p>
            <p><strong>Fecha:</strong> {{ formatDate(event.date) }}</p>
            <p><strong>Número de personas:</strong> {{ spectator.numberOfPeople }}</p>
            <div class="card-actions justify-start mt-4">
              <div v-if="!spectator.isCheckinActive" class="alert alert-info rounded-none flex text-left">
                <InformationCircleIcon class="-ml-1 mr-3 h-5 min-w-5" aria-hidden="true" />
                <span class="text-xs">El día del concierto se habilitará el acceso a tu checkin. </span>
              </div>
              <button v-else class="btn btn-primary text-white w-full" @click="goToEvent(event)">Hacer checkin</button>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <p><strong>Tus datos:</strong></p>
          <p class="text-sm"><strong>Email:</strong> {{ spectator.email }}</p>
          <p class="text-sm"><strong>Teléfono:</strong> {{ spectator.phone }}</p>
        </div>
      </div>
      <div v-else class="flex justify-center w-full">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    </div>
    <div v-else class="flex justify-center w-full">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, collection } from 'firebase/firestore';
import { InformationCircleIcon } from '@heroicons/vue/24/outline'


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
      await fetchEvents(spectator.value['subscribedEventsId']);
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
