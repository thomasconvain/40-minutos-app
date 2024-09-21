<template>
  <div class="w-full">
    <h1 class="text-2xl font-bold mb-6">Hola {{ spectator?.name }} 👋</h1>
    <p>Gracias por inscribirte a uno de nuestros eventos.<br>
      Por favor muestra esa pantalla antes de ingresar al recinto.</p>
    <div class="mt-4" v-if="spectator">
      <p><strong>Tus datos:</strong></p>
      <p class="text-sm"><strong>Email:</strong> {{ spectator.email }}</p>
      <p class="text-sm"><strong>Teléfono:</strong> {{ spectator.phone }}</p>
      <p class="my-4"><strong>Estás inscrito para los siguientes eventos:</strong></p>
      <div v-if="events.length">
        <div v-for="event in events" :key="event.id" class="card sm:card-side bg-base-100 border border-base-600">
          <figure class="sm:max-w-52 max-w-full">
            <img
              src="../assets/afiche 40 minutos_1.png"
              alt="Shoes" />
          </figure>
          <div class="card-body">
            <h2 class="card-title">{{ event.name }}</h2>
            <p><strong>Lugar:</strong> {{ event.place }}</p>
            <p><strong>Fecha:</strong> {{ formatDate(event.date) }}</p>
            <p><strong>Número de personas:</strong> {{ spectator.number_of_people }}</p>
            <div class="card-actions justify-start mt-4">
              <button class="btn btn-primary text-white" @click="goToEvent(event)">Entrar al concierto</button>
            </div>
          </div>
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
