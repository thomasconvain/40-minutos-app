<template>
    <div>
      <section class="pt-6 pb-4">
        <div class="mx-auto max-w-screen-xl">          
          <!-- Carrusel de daisyUI -->
          <div class="relative w-full overflow-hidden">
            <div class="carousel carousel-center w-full rounded-box gap-4" id="carousel">
              <!-- Asegurando que cada tarjeta tenga el ancho adecuado -->
              <div v-for="event in activeEvents" :key="event.id" class="carousel-item w-full mx-auto">
                <!-- La tarjeta con ancho controlado -->
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
                        @click="router.push({ name: 'Booking', params: { idEvent: event.id } })"
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
                        @click="router.push({ name: 'LogIn' })"
                      >
                        <span>Realizar mi aporte</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
            <!-- Botones de navegación con lógica para mostrar solo el botón relevante -->
            <div v-if="activeEvents.length > 1" class="flex justify-center mt-4 gap-3">
              <button 
                class="btn btn-circle btn-sm" 
                :class="{'btn-primary': carouselPosition > 0, 'opacity-50': carouselPosition === 0}"
                :disabled="carouselPosition === 0"
                @click="scrollCarousel('prev')"
              >❮</button>
              <button 
                class="btn btn-circle btn-sm" 
                :class="{'btn-primary': carouselPosition < activeEvents.length - 1, 'opacity-50': carouselPosition >= activeEvents.length - 1}"
                :disabled="carouselPosition >= activeEvents.length - 1"
                @click="scrollCarousel('next')"
              >❯</button>
            </div>
          </div>
        </div>
      </section>

      <div class="mx-auto w-full max-w-screen-xl rounded-2xl bg-white p-6 md:p-8 mt-2"
      >
        <div class="w-full">
          <h2
          class="mb-2 text-xl font-bold leading-tight text-black md:text-2xl"
          >
          ¿Te invitaron a un evento privado?
          </h2>
          <p class="mb-4 text-sm text-gray-700">
            Ingresa tu código de acceso acá
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="codeIdForPrivateEvents"
              type="text"
              id="event-code"
              placeholder="Ingresa tu código"
              class="input input-bordered w-full"
              required
            />
            <button
              @click="checkIdAndRedirect()"
              type="button"
              class="btn bg-black hover:bg-gray-800 text-white"
            >
              Confirmar asistencia
            </button>
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
import { ref, onMounted, onBeforeUnmount, defineEmits, defineProps, computed } from "vue";
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
const carouselPosition = ref(0); // Seguimiento de la posición actual en el carrusel

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
        router.push({ name: 'Booking', params: { idEvent: eventId } });
      }
    } else {
      // No se encontró ningún documento
      window.alert("El código de evento ingresado no existe");
    }
  } catch (error) {
    window.alert("Error verificando el ID de evento:", error);
  }
};

// Función para desplazar el carrusel
const scrollCarousel = (direction) => {
  const carousel = document.getElementById('carousel');
  const scrollAmount = direction === 'next' ? carousel.offsetWidth : -carousel.offsetWidth;
  carousel.scrollBy({left: scrollAmount, behavior: 'smooth'});
  
  // Actualizar la posición después del desplazamiento
  if (direction === 'next') {
    carouselPosition.value++;
  } else {
    carouselPosition.value--;
  }
};

// Función para manejar el evento de scroll del carrusel
const handleCarouselScroll = () => {
  const carousel = document.getElementById('carousel');
  if (!carousel) return;
  
  // Calcular la posición actual basada en el desplazamiento
  const scrollLeft = carousel.scrollLeft;
  const itemWidth = carousel.offsetWidth;
  const newPosition = Math.round(scrollLeft / itemWidth);
  
  // Actualizar la posición solo si ha cambiado
  if (newPosition !== carouselPosition.value) {
    carouselPosition.value = newPosition;
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  });
  
  fetchActiveEvents();
  
  if (props.openModalSuccessAfterLogin) {
    openModal(null, 'modalSuccess');
  }
  
  // Añadir event listener para scroll del carrusel
  const carousel = document.getElementById('carousel');
  if (carousel) {
    carousel.addEventListener('scroll', handleCarouselScroll);
  }
});

// Limpiar event listeners cuando el componente se destruya
onBeforeUnmount(() => {
  const carousel = document.getElementById('carousel');
  if (carousel) {
    carousel.removeEventListener('scroll', handleCarouselScroll);
  }
});
</script>

<style scoped>

</style>