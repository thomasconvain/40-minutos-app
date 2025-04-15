<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="logout">
      Salir
    </button>
    <h1 class="text-2xl font-bold mb-6">Hola {{ spectator?.name }}👋</h1>
    <p v-if="events.length">Acá podrás ver todos los eventos en los que estás inscrito.</p>
    
    <!-- Primer mensaje informativo sobre la reserva - verde con check icon en círculo -->
    <div 
      v-if="spectator && $route.query.from && !infoReserveDismissed" 
      class="relative my-4 p-[1px] rounded-lg bg-gradient-to-br from-green-400/80 to-transparent"
    >
      <div class="bg-green-50 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
            <CheckCircleIcon class="h-6 w-6 text-green-500" aria-hidden="true" />
        </div>
        <div class="flex-1 text-black">
          <h3 class="font-bold text-md">Reserva exitosa</h3>
          <div class="text-sm mt-1">
              <p>Hemos enviado una confirmación a tu correo.</p>
              <p class="mt-2"> El ingreso es por <strong>orden de llegada</strong> y solo debes hacer check-in digital cuando llegues a tu asiento.</p>
          </div>
        </div>
      </div>
      
      <div class="mt-4 text-center">
        <button 
            class="btn btn-md bg-white hover:bg-transparent text-black border-none" 
          @click="dismissReserveInfo"
        >
          Entendido
        </button>
      </div>
    </div>
    </div>

    
    <div class="mt-4" v-if="spectator">
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
                {{ spectator.numberOfCompanions }} personas
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
                  <!-- <InformationCircleIcon
                    class="-ml-1 mr-3 h-5 min-w-5"
                    aria-hidden="true"
                  /> -->
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
                    :href="`https://wa.me/?text=https://cuarenta-minutos.web.app/sign-in/${event.id}/?referenceLink=true%26hostId=${spectator.uId}`"
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

      <!-- Segundo mensaje sobre la contraseña temporal - estilo gris transparente sin bordes con icono de candado -->
      <div 
  v-if="spectator && !spectator.passwordChanged" 
  class="relative my-6 p-[1px] rounded-xl bg-gradient-to-br from-orange-400/80 to-transparent"
      >
  <div class="bg-orange-50 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
        <LockClosedIcon class="h-6 w-6 text-orange-500" aria-hidden="true" />
          </div>
          <div class="flex-1 text-gray-700">
            <h3 class="font-bold text-md text-gray-700">Cambia tu contraseña</h3>
            <div class="text-sm mt-1 text-gray-600">
              <p>Por tu seguridad, te creamos una constraseña temporal.</p>
              <p class="mt-2">Para volver a entrar a este lugar, debes cambiarla y hace login.</p>
              <p v-if="message !== ''" class="mt-2 text-sm text-green-700 font-medium">
                {{ message }}
              </p>
            </div>
          </div>
        </div>
        
        <div v-if="message === ''" class="mt-4 text-center">
          <button 
        class="btn btn-md bg-white hover:bg-transparent text-black border-none" 
            @click="handleReset"
          >
            Cambiar contraseña
          </button>
        </div>
      </div>
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
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  arrayUnion 
} from "firebase/firestore";
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { ShareIcon, CheckCircleIcon, LockClosedIcon } from "@heroicons/vue/24/outline";
import { fetchSpectators } from '@/utils';
import { getFunctions, httpsCallable } from 'firebase/functions'

//functions sendEmail
const functions = getFunctions()
const sendEmail = httpsCallable(functions, 'sendEmailWithBrevo')

// Estado de la aplicación
const eventAttendees = ref({}); 
const currentUser = ref(null);
const spectator = ref(null);
const events = ref([]);
const isLoading = ref(true);
const message = ref('');
const subscriptionAfterLogin = ref(false);
const infoReserveDismissed = ref(false);

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
    await sendEmail({
      to: spectator.value.email,
      templateId: 1,
      newEventId: eventId,
      params: {
        name: spectator.value.name,
        surname: spectator.value.lastName,
        phone: spectator.value.phone,
        firebaseId: spectator.value.uId,
      }
    })
  } catch (error) {
    console.error("Error al agregar el evento:", error);
  }
};

// Función para formatear la fecha
const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return "Fecha no disponible";
  }
  const date = timestamp.toDate();
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

// Función para navegar a la página del evento
const goToEvent = (event) => {
  if (!event || !event.id) return;
  
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
    router.push('/');
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};

const handleReset = async () => {
  if (!spectator.value || !spectator.value.email) {
    message.value = "Error: datos de usuario no disponibles";
    return;
  }
  
  try {
    await sendPasswordResetEmail(auth, spectator.value.email);
    
    // Actualizar el campo passwordChanged en Firestore
    const db = getFirestore();
    const spectatorDocRef = doc(db, "spectators", idSpectator);
    await updateDoc(spectatorDocRef, {
      passwordChanged: true
    });
    
    message.value = "✉️ Te enviamos un correo, revísalo!";
    
    // Actualizar el estado local
    // spectator.value.passwordChanged = true;
  } catch (error) {
    message.value = "Error al enviar el correo: " + error.message;
  }
};

// Función para ocultar el mensaje informativo de reserva
const dismissReserveInfo = () => {
  infoReserveDismissed.value = true;

  // Limpiar el parámetro 'from' de la URL porque ya no es necesario si el usuario ha visto el mensaje
  const newQuery = { ...route.query }
  delete newQuery['from']

  router.replace({ path: route.path, query: newQuery })
};
</script>

<style scoped></style>