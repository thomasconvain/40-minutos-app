<template>
  <div>
    <button class="btn bg-white bg-opacity-30 border-none mb-4" @click="logout">
      Salir
    </button>
    <h1 class="text-2xl font-bold mb-6">Hola {{ spectator?.name }}👋</h1>
    <p v-if="events.length">Acá podrás ver todos los eventos en los que estás inscrito.</p>
    <div class="mt-4" v-if="spectator">
      <!-- <p v-if="events.length" class="my-4">
        <strong>Estás inscrito para los siguientes eventos:</strong>
      </p> -->
      <div v-if="events.length">
        <div class="indicator w-full flex flex-col gap-4">
          <div
            v-for="event in events"
            :key="event.id"
            class="card w-full bg-base-100 border border-base-600"
          >
            <span
              v-if="!event?.isCheckinActive"
              class="indicator-item badge badge-primary"
              >Pronto</span
            >
            <div class="card-body">
              <h2 class="card-title">{{ event.name }}</h2>
              <p><strong>Lugar:</strong> {{ event.place }}</p>
              <p><strong>Fecha:</strong> {{ formatDate(event.date) }}</p>
              <p>
                <strong>Te acompañan:</strong>
                {{ spectator.numberOfPeople -1 }} personas
              </p>
              <p>
                <strong>Total de inscritos:</strong>
                {{ eventAttendees[event.id] || 0 }} personas
              </p>
              <p v-if="event.hostName">
                <strong>Anfitrión:</strong> {{ event.hostName }}
              </p>
              <div class="card-actions justify-start mt-4">
                <button
                  v-if="event.isCheckinActive || spectator.forceCheckinActive"
                  class="btn-md btn btn-primary text-white w-full"
                  @click="goToEvent(event)"
                >
                  {{ spectator.isChecked ? "Entrar" : "Hacer checkin" }}
                </button>
                <div
                  v-else
                  class="alert alert-info rounded-none flex text-left"
                >
                  <InformationCircleIcon
                    class="-ml-1 mr-3 h-5 min-w-5"
                    aria-hidden="true"
                  />
                  <span class="text-xs"
                    >El día del concierto se habilitará el acceso a tu checkin.
                  </span>
                </div>
                <div
                  class="w-full"
                  v-if="
                    (!event.isFreeEntrance && spectator.isHost) ||
                    event.isFreeEntrance
                  "
                >
                  <a
                    :href="`https://wa.me/?text=https://cuarenta-minutos.web.app/booking/${event.id}/?referenceLink=true%26hostId=${spectator.uId}`"
                  >
                    <button class="btn btn-active mt-2 w-full">
                      <ShareIcon
                        class="-ml-1 mr-3 h-4 w-4"
                        aria-hidden="true"
                      />Compartir evento
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-4 text-sm italic text-gray-400">
          En caso de cualquier inconveniente, muestra esta pantalla para validar
          tu reserva.
        </p>
      </div>
      <div v-else-if="isLoading" class="flex justify-center w-full">
        <span class="loading loading-spinner loading-md"></span>
      </div>
      <p v-else class="my-4">
        <strong>No estás inscrito a ningún evento.</strong>
      </p>
      <p class="my-4">
        <strong>Revisa nuestros próximos eventos:</strong>
      </p>
      <ActiveEvents 
        :isSpectatorSubscribed="checkSubscription"
        :openModalSuccessAfterLogin="subscriptionAfterLogin"
        :routerQueryIdEvent="route.query.idEvent"
        @updateSubscribedEvents="({ eventId, numberOfPeople }) => addSubscribedEventId(auth.currentUser.uid, eventId, numberOfPeople)"
      />
      </div>
    <div v-else class="flex justify-center w-full">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getFirestore, doc, getDoc, updateDoc, collection, arrayUnion  } from "firebase/firestore";
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { InformationCircleIcon, ShareIcon } from "@heroicons/vue/24/outline";
import ActiveEvents from "@/components/ActiveEvents.vue";
import { fetchSpectators } from '@/utils'

// Cambia de un valor simple a un objeto que mapea eventId -> número de personas
const eventAttendees = ref({}); 

// Obtiene cantidad de asistentes por evento
const fetchEventAttendees = async (eventId) => {
  const count = await fetchSpectators(eventId);
  eventAttendees.value[eventId] = count;
};

// Obtener el ID del espectador desde la ruta
const route = useRoute();
const idSpectator = route.params.idSpectator;
const currentUser = ref(null);
const subscriptionAfterLogin = ref(false);
const isLoading = ref(true); // Variable reactiva para mostrar un spinner de carga

// Variables reactivas para almacenar los datos del espectador y los eventos
const spectator = ref(null);
const events = ref([]);
const router = useRouter(); // Instancia de Vue Router

// Función para obtener los datos del espectador desde Firestore
const fetchSpectator = async () => {
  isLoading.value = true
  const db = getFirestore();
  const docRef = doc(db, "spectators", idSpectator);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
      await fetchEvents(spectator.value["subscribedEventsId"]);
    } else {
      console.error("No se encontró el documento con el ID proporcionado");
    }
  } catch (error) {
    console.error("Error al obtener los datos del espectador:", error);
  }
};

// Función para obtener los detalles de los eventos usando los IDs
const fetchEvents = async (eventIds) => {
  const db = getFirestore();
  const eventsCollection = collection(db, "events");

  try {
    const eventDocsPromises = eventIds.map((eventId) =>
      getDoc(doc(eventsCollection, eventId))
    );
    const eventDocs = await Promise.all(eventDocsPromises);

    events.value = eventDocs
      .filter((eventDoc) => eventDoc.exists() && eventDoc.data().isActive === true)
      .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }));
    
    // Para cada evento, obtener el número de asistentes
    for (const event of events.value) {
      fetchEventAttendees(event.id);
    }
  } catch (error) {
    console.error("Error al obtener los detalles de los eventos:", error);
  }
};

const checkSubscription = (eventId) => {
  return spectator.value.subscribedEventsId.includes(eventId);
};

const addSubscribedEventId = async (spectatorId, eventId, numberOfPeople) => {
  const db = getFirestore();
  console.log('numberOfPeople', numberOfPeople); 
  console.log('spectaroId', spectatorId);
  console.log('newEventId', eventId);
  const spectatorDocRef = doc(db, "spectators", spectatorId);

  try {
    await updateDoc(spectatorDocRef, {
      subscribedEventsId: arrayUnion(eventId),
      numberOfPeople: numberOfPeople,
    });
    console.log("Evento agregado correctamente.");
    fetchSpectator();
  } catch (error) {
    console.error("Error al agregar el evento:", error);
  }
};

// Función para formatear la fecha
const formatDate = (timestamp) => {
  const date = timestamp.toDate();
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

// Función para navegar a la página del evento
const goToEvent = (event) => {
  router.push({
    name: spectator.value.isChecked ? "EventDetail" : "CheckIn",
    params: {
      idSpectator: idSpectator,
      idEvent: event.id,
      nameEvent: event.name,
    },
  });
};

const logout = async () => {
  try {
    await signOut(auth);
    // Redirigir a la ruta que prefieras tras el logout
    router.push('/');
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};

onMounted(() => {
  // Obtiene el ID del evento de la URL
  const eventIdFromUrl = route.query.idEvent;
  
  // Llama a la función con el ID del evento
  if (eventIdFromUrl) {
    fetchEventAttendees(eventIdFromUrl);
  } else {
    fetchEventAttendees(); // Sin parámetro para mantener compatibilidad
  }
  
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
  fetchSpectator();
  if (route.query.idEvent) {
    subscriptionAfterLogin.value = true;
    addSubscribedEventId(idSpectator, route.query.idEvent, 1);
  }
  isLoading.value = false;
});
</script>

<style scoped></style>
