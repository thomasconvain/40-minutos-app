<template>
    <div>
      <section class="py-8">
        <div class="mx-auto max-w-screen-xl">
          <h2 class="mb-6 text-2xl font-bold text-black">Eventos disponibles</h2>
          
          <!-- Carrusel de daisyUI -->
          <div class="carousel rounded-box">
            <!-- Itera sobre cada evento dentro del carrusel -->
            <div v-for="event in activeEvents" :key="event.id" class="carousel-item w-full md:w-1/2 lg:w-1/3 p-2">
              <!-- Cada evento como una tarjeta dentro del carrusel -->
              <div class="card bg-black text-white shadow-xl h-full w-full">
                <div class="card-body">
                  <h2 class="card-title text-xl md:text-2xl font-bold">{{ event.name }}</h2>
                  <p class="text-sm md:text-base">{{ convertTimestamp(event.date) }}</p>
            
                  <p v-if="event.isOver" class="my-3 text-gray-300">
                    Evento terminado. Si aún no realizaste tu aporte puedes hacerlo haciendo click en el siguiente botón.
                  </p>
                  <p v-else-if="event.isFreeEntrance" class="my-3 text-gray-300">
                    {{ event.place }}
                  </p>
            
                  <div class="card-actions mt-4">
                    <button
                      v-if="!event.isOver && event.isFreeEntrance && !currentUser"
                      type="button"
                      class="btn btn-sm md:btn-md bg-white text-black hover:bg-gray-200 border-transparent"
                      @click="router.push({ name: 'SignIn', params: { idEvent: event.id } })"
                    >
                      <span>Quiero asistir</span>
                    </button>
              
                    <button
                      v-if="!event.isOver && event.isFreeEntrance && currentUser && !isSpectatorSubscribed(event.id)"
                      type="button"
                      class="btn btn-sm md:btn-md bg-white text-black hover:bg-gray-200 border-transparent"
                      @click="openModal(event.id, 'modalValidation')"
                    >
                      <span>Consigue tu ticket en un click</span>
                    </button>
              
                    <div v-if="isSpectatorSubscribed(event.id)" class="flex items-center">
                      <CheckCircleIcon v-if="!isLoading" class="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Ya estas inscrito a este evento
                    </div>
              
                    <button
                      v-if="!currentUser && event.isOver"
                      type="button"
                      class="btn btn-sm md:btn-md btn-outline text-white hover:bg-white hover:text-black"
                      @click="router.push({ name: 'SignIn' })"
                    >
                      <span>Realizar mi aporte</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="mx-auto grid max-w-screen-xl rounded-lg bg-white p-8 md:p-8 lg:grid-cols-12 lg:gap-8 lg:p-16 xl:gap-16"
      >
        <div class="me-auto place-self-center lg:col-span-7">
          <h1
          class="mb-3 text-2xl font-bold leading-tight tracking-tight text-black md:text-4xl"
          >
          ¿Te invitaron a un evento privado?
          </h1>
          <p class="mb-6 text-gray-800">
            Ingresa tu código de acceso acá
          </p>
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center flex-wrap gap-3">
              <input
                v-model="codeIdForPrivateEvents"
                type="text"
                id="name"
                placeholder="Ingresa tu código"
                class="input input-bordered w-full sm:w-auto"
                required
              />
              <button
                @click="checkIdAndRedirect()"
                type="button"
                class="btn-md w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
              >
                <span>Confirmar asistencia</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    <dialog id="modalSuccess" class="modal">
            <div class="modal-box">
              <h3 class="text-lg font-bold">¡Muchas gracias!</h3>
              <p class="py-4">Tu inscripción ha sido exitosa. En esta pantalla encontrarás todos los detalles del evento.</p>
              <div class="modal-action">
                <form method="dialog">
                  <button class="btn hover:bg-black hover:text-white">Continuar</button>
                </form>
              </div>
            </div>
    </dialog>
  </div>

  <dialog id="modalValidation" class="modal">
          <div class="modal-box">
              <h3 class="text-lg font-bold">¿Cuantas personas asistirán en total?</h3>
              <input v-model="numberOfPeople" type="number" min="1" placeholder="Ingresa el número de participantes" class="input input-bordered w-full mt-4" />
              <form method="dialog">
                  <button
                      class="btn-md btn btn-primary text-white w-full mt-4"
                      @click="addSubscribedEvent(currentEventIdForModal)">
                      Me inscribo
                  </button>
              </form>
          </div>
          <form method="dialog" class="modal-backdrop">
              <button>close</button>
          </form>
        </dialog>
        
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, onMounted, defineEmits, defineProps, computed } from "vue";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from "@/firebase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  isSpectatorSubscribed: {
    type: Function,
    default: () => false,
  },
  openModalSuccessAfterLogin : {
    type: Boolean,
    default: false,
  },
  routerQueryIdEvent: {
    type: String,
    default: null,
  },
});

const events = ref([]);
const router = useRouter();

const currentUser = ref(null);
const numberOfPeople = ref(1);
const modalValidation = ref(null);

const currentEventIdForModal = ref(null);
const codeIdForPrivateEvents = ref(null); 

// Añadir computed property para eventos activos
const activeEvents = computed(() => {
  return events.value.filter(event => !event.isOver && event.isFreeEntrance);
});

const fetchActiveEvents = async () => {
  try {
    const q = query(
      collection(db, "events"),
      where("isActive", "==", true),
      where("isFreeEntrance", "==", true),
      orderBy("date", "asc") // Cambia a "desc" para orden descendente
    );

    const querySnapshot = await getDocs(q);
    events.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // agrega booleano para definir si el spectator ya está suscrito al evento o no
      isSubscribed: props.isSpectatorSubscribed,
    }));
  } catch (error) {
    console.error("Error fetching active events: ", error);
  }
};

const convertTimestamp = (timestamp) => {
  // Convierte el timestamp en un objeto de fecha y luego lo formatea
  return format(timestamp.toDate(), "EEEE dd 'de' MMMM '|' HH.mm 'hrs'", {
    locale: es,
  });
};

const emit = defineEmits(["updateSubscribedEvents"]);

const addSubscribedEvent = async (eventId) => {
  emit("updateSubscribedEvents", { eventId, numberOfPeople: numberOfPeople.value });
};

const openModal = (eventId, modalId) => {
  currentEventIdForModal.value = eventId;
  modalValidation.value = document.getElementById(modalId);
  modalValidation.value.showModal();

};

const checkIdAndRedirect = async () => {
  try {
    if (!codeIdForPrivateEvents.value) {
      window.alert("Por favor, ingresa un código de evento válido");
      return;
    }

    // Consulta Firebase usando el campo "invitationCode"
    const eventsCollection = collection(db, "events");
    const q = query(eventsCollection, where("invitationCode", "==", codeIdForPrivateEvents.value));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Se encontró un documento
      const eventDoc = querySnapshot.docs[0]; // Obtiene el primer documento encontrado
      const eventId = eventDoc.id; // Obtiene el ID del documento
      if (currentUser.value) {
        addSubscribedEvent(eventId);
        openModal(eventId, 'modalSuccess');
        codeIdForPrivateEvents.value = null;
        window.scrollTo({top: 0, behavior: "smooth"});
      } else {
        router.push({ name: 'SignIn', params: { idEvent: eventId } });
      }
    } else {
      // No se encontró ningún documento
      window.alert("El código de evento ingresado no existe");
    }
  } catch (error) {
    window.alert("Error verificando el ID de evento:", error);
  }
};

onMounted(() => {
    onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  }),
  fetchActiveEvents();
  if (props.openModalSuccessAfterLogin) {
    openModal(null, 'modalSuccess');
  }
});
</script>

<style scoped>

</style>