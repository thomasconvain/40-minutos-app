<template>
  <div>
    <NavbarMenu />
    
    <h1 class="text-2xl font-bold mb-6">Hola {{ spectator?.name }}👋</h1>
    <p v-if="events.length">Acá podrás ver todos los eventos en los que estás inscrito.</p>
    

    
    <div class="mt-4" v-if="spectator">
      <div v-if="events.length">
        <div class="indicator w-full flex flex-col gap-4">
          <EventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
            :isLoggedIn="true"
            :numberOfCompanions="getNumberOfCompanionsForEvent(event.id)"
            :showCheckinMessage="!event.status?.isCheckInOpen"
            :checkinMessageText="'El día del concierto se habilitará el acceso a tu checkin.'"
            :showActionButton="!!(event.status?.isCheckInOpen || spectator?.forceCheckinActive)"
            :actionButtonText="spectator?.hasCheckIn ? 'Entrar' : 'Hacer checkin'"
            :showShareButton="(event.settings?.isPrivate && spectator?.isHost) || !event.settings?.isPrivate"
            :spectatorId="spectator?.uId"
            :showLogo="false"
            buttonStyle="black"
            @action="goToEvent"
          />
        </div>
        <p class="mt-4 text-sm italic text-gray-400">
          En caso de cualquier inconveniente, muestra esta pantalla para validar
          tu reserva.
        </p>
      </div>

  

      <div v-else-if="isLoading" class="flex justify-center w-full">
        <span class="loading loading-spinner loading-md"></span>
      </div>
      <p v-else-if="!events.length" class="my-4">
        <strong>No estás inscrito a ningún evento.</strong>
      </p>
    </div>
    <div v-else class="flex justify-center w-full">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavbarMenu from '@/components/NavbarMenu.vue';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  arrayUnion 
} from "firebase/firestore";
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchSpectators } from '@/utils';
// import { getFunctions, httpsCallable } from 'firebase/functions'; // COMMENTED OUT - BREVO EMAILS DISABLED
// Imports de date-fns ya no son necesarios aquí
import EventCard from '@/components/EventCard.vue';

//functions sendEmail - COMMENTED OUT TO DISABLE BREVO EMAILS
// const functions = getFunctions()
// const sendEmail = httpsCallable(functions, 'sendEmailWithBrevo')

// Estado de la aplicación
const eventAttendees = ref({}); 
const currentUser = ref(null);
const spectator = ref(null);
const events = ref([]);
const isLoading = ref(true);
const subscriptionAfterLogin = ref(false);

// Router y parámetros
const route = useRoute();
const router = useRouter();
const idSpectator = route.params.idSpectator;

// Inicialización principal
onMounted(() => {
  // Inicializar la aplicación
  init();
});

// Inicialización principal
const init = async () => {
  // Establecer observador de autenticación
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
  
  // Obtener ID de evento de la URL si existe
  const eventIdFromUrl = route.query.idEvent;
  
  // Si hay un ID de evento en la URL, obtener asistentes
  if (eventIdFromUrl) {
    fetchEventAttendees(eventIdFromUrl);
  }
  
  // Cargar datos del espectador
  await fetchSpectator();
  
  // Si hay un ID de evento en la URL, suscribir al usuario
  if (eventIdFromUrl) {
    subscriptionAfterLogin.value = true;
    await addSubscribedEventId(idSpectator, eventIdFromUrl, 1);
  }

  // Limpia IdEvent de la URL cuando ya no se necesita para evitar hacer llamadas innecesarias y envios de correo multiples cuando usuario refresca pagina
  const newQuery = { ...route.query }
  delete newQuery['idEvent']

  router.replace({ path: route.path, query: newQuery })
  
  isLoading.value = false;
};

// Obtiene cantidad de asistentes por evento
const fetchEventAttendees = async (eventId) => {
  try {
    const count = await fetchSpectators(eventId);
    eventAttendees.value[eventId] = count;
  } catch (error) {
    console.error("Error al obtener asistentes:", error);
    eventAttendees.value[eventId] = 0;
  }
};

// Función para obtener los datos del espectador desde Firestore
const fetchSpectator = async () => {
  isLoading.value = true;
  const db = getFirestore();
  const docRef = doc(db, "spectators", idSpectator);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
      if (spectator.value.subscribedEventsId && spectator.value.subscribedEventsId.length > 0) {
        await fetchEvents(spectator.value.subscribedEventsId);
      } else {
        events.value = [];
      }
    } else {
      console.error("No se encontró el documento con el ID proporcionado");
    }
  } catch (error) {
    console.error("Error al obtener los datos del espectador:", error);
  } finally {
    isLoading.value = false;
  }
};

// Función para obtener los detalles de los eventos usando los IDs
const fetchEvents = async (eventIds) => {
  if (!eventIds || eventIds.length === 0) return;
  
  console.log("Buscando eventos con IDs:", eventIds);
  
  const db = getFirestore();
  const eventsCollection = collection(db, "events");

  try {
    const eventDocsPromises = eventIds.map((eventId) =>
      getDoc(doc(eventsCollection, eventId))
    );
    const eventDocs = await Promise.all(eventDocsPromises);
    
    // Log para depuración
    eventDocs.forEach(doc => {
      if (doc.exists()) {
        console.log("Evento encontrado:", doc.id, "settings.isActive:", doc.data().settings?.isActive);
      } else {
        console.log("Evento no encontrado:", doc.id);
      }
    });

    // Filtrar eventos donde el usuario esté en zSpectator y el evento esté activo
    events.value = eventDocs
      .filter((eventDoc) => {
        if (!eventDoc.exists() || eventDoc.data().settings?.isActive !== true) {
          return false;
        }
        
        // Verificar que el usuario esté en zSpectator
        const data = eventDoc.data();
        const userInZSpectator = data.zSpectator && 
          data.zSpectator.some(spec => spec.spectatorId === spectator.value?.uId);
        
        return userInZSpectator;
      })
      .map((eventDoc) => {
        const data = eventDoc.data();
        console.log("Evento procesado:", eventDoc.id, "data:", JSON.stringify(data));
        return { 
          id: eventDoc.id, 
          ...data,
          // Compatibilidad con el modelo antiguo para el componente EventCard
          isCheckinActive: data.status?.isCheckInOpen || false,
          isOpen: data.status?.isReservationOpen || false
        };
      });
    
    console.log("Eventos filtrados y procesados:", events.value.length);
    
    // Para cada evento, obtener el número de asistentes
    for (const event of events.value) {
      fetchEventAttendees(event.id);
    }
  } catch (error) {
    console.error("Error al obtener los detalles de los eventos:", error);
  }
};

// Función para obtener el número de acompañantes para un evento específico
const getNumberOfCompanionsForEvent = (eventId) => {
  const event = events.value.find(e => e.id === eventId);
  
  // Usar zSpectator en lugar de eventSpectators para la nueva estructura
  if (!event || !event.zSpectator) return 0;
  
  // Buscar por spectatorId en lugar de email
  const userSpectator = event.zSpectator.find(spec => spec.spectatorId === spectator.value?.uId);
  return userSpectator ? userSpectator.numberOfCompanions : 0;
};

const addSubscribedEventId = async (spectatorId, eventId, numberOfPeople) => {
  if (!spectatorId || !eventId) return;
  
  const db = getFirestore();
  const spectatorDocRef = doc(db, "spectators", spectatorId);

  try {
    await updateDoc(spectatorDocRef, {
      subscribedEventsId: arrayUnion(eventId),
      numberOfPeople: numberOfPeople || 1,
    });
    console.log("Evento agregado correctamente.");
    await fetchSpectator();
    // COMMENTED OUT TO DISABLE BREVO EMAILS
    // await sendEmail({
    //   to: spectator.value.email,
    //   templateId: 1,
    //   newEventId: eventId,
    //   params: {
    //     name: spectator.value.name,
    //     surname: spectator.value.lastName,
    //     phone: spectator.value.phone,
    //     firebaseId: spectator.value.uId,
    //   }
    // })
  } catch (error) {
    console.error("Error al agregar el evento:", error);
  }
};

// Función de formateo ahora está en el componente EventCard

// Función para formatear partes de la fecha (ya no se usa con EventCard)
/*const formatDatePart = (timestamp, part) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return "No disponible";
  }
  
  try {
    const formattedDate = formatDate(timestamp);
    if (formattedDate === "Fecha no disponible") return "No disponible";
    
    const parts = formattedDate.split('|');
    
    if (part === 'date' && parts.length > 0) {
      return parts[0].trim();
    } else if (part === 'time' && parts.length > 1) {
      return parts[1].trim();
    } else {
      return "No disponible";
    }
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "No disponible";
  }
*/

// Función para navegar a la página del evento
const goToEvent = (event) => {
  if (!event || !event.id) return;
  
  // Verificar si el espectador ya hizo check-in para este evento específico usando la nueva estructura
  const spectatorWasCheckedIn = event.zSpectator?.some(spec => 
    spec.spectatorId === spectator.value?.uId && spec.hasCheckIn === true
  );
  
  router.push({
    name: spectatorWasCheckedIn ? "EventDetail" : "CheckIn",
    params: {
      idSpectator: idSpectator,
      idEvent: event.id,
      nameEvent: event.name,
    },
  });
};


</script>

<style scoped></style>