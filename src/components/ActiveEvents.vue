<template>
    <div>
      <section class="pt-6 pb-4">
        <div class="mx-auto max-w-screen-xl">          
          <!-- Carrusel de daisyUI -->
          <div class="relative w-full overflow-hidden">
            <div class="carousel carousel-center w-full rounded-box gap-4" id="carousel">
              <!-- Asegurando que cada tarjeta tenga el ancho adecuado -->
              <div v-for="event in activeEvents" :key="event.id" class="carousel-item w-full mx-auto">
                <!-- Usando el componente compartido EventCard con estilo para Home -->
                <EventCard
                  :event="event"
                  :isLoggedIn="!!currentUser"
                  :numberOfCompanions="event.isUserInEvent && event.zSpectator ? event.zSpectator.numberOfCompanions || 0 : undefined"
                  :showCheckinMessage="true"
                  :checkinMessageText="''"
                  :customMessageClass="true"
                  :showActionButton="(!event.status?.isFinished && !event.settings?.isPrivate && !currentUser) || 
                                    (!event.status?.isFinished && !event.settings?.isPrivate && currentUser && !props.isSpectatorSubscribed(event.id) && !event.isUserInEvent) ||
                                    (!currentUser && event.status?.isFinished && event.settings?.isTipAccepted)"
                  :actionButtonText="getButtonText(event)"
                  :showShareButton="false"
                  :showLogo="false"
                  buttonStyle="white"
                  class="bg-black text-white shadow-xl"
                  @action="handleEventAction"
                />
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
// Imports de date-fns ya no son necesarios aquí
// No hero icons needed for EventCard
import EventCard from '@/components/EventCard.vue';

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
  return events.value.filter(event => 
    event.settings?.isActive && !event.status?.isFinished && !event.settings?.isPrivate
  );
});

const fetchActiveEvents = async () => {
  try {
    console.log('Iniciando fetchActiveEvents()');
    const q = query(
      collection(db, "events"),
      where("settings.isActive", "==", true),
      where("settings.isPrivate", "==", false),
      orderBy("date", "asc") // Cambia a "desc" para orden descendente
    );

    const querySnapshot = await getDocs(q);
    console.log('Eventos recibidos de Firestore:', querySnapshot.docs.length);
    events.value = querySnapshot.docs.map((doc) => {
      const eventData = doc.data();
      console.log('Evento ID:', doc.id, 'isActive:', eventData.settings?.isActive, 'isPrivate:', eventData.settings?.isPrivate, 'isFinished:', eventData.status?.isFinished);
      // Verificar si el usuario actual está en la lista de zSpectator por ID
      let isUserInEvent = false;
      let spectatorInfo = null;
      
      if (currentUser.value && eventData.zSpectator) {
        // Asumimos que tenemos el spectatorId asociado al usuario actual
        const spectatorId = currentUser.value.uid; // O el ID que uses para identificar al espectador
        const userSpectator = eventData.zSpectator.find(spec => spec.spectatorId === spectatorId);
        
        if (userSpectator) {
          isUserInEvent = true;
          spectatorInfo = userSpectator;
        }
      }
      
      return {
        id: doc.id,
        ...eventData,
        isSubscribed: props.isSpectatorSubscribed,
        isUserInEvent: isUserInEvent,
        spectatorInfo: spectatorInfo
      };
    });
  } catch (error) {
    console.error("Error fetching active events: ", error);
  }
};

// Helper function for formatting is now in EventCard component

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

    // Consulta Firebase usando el campo "settings.invitationCode"
    const eventsCollection = collection(db, "events");
    const q = query(eventsCollection, where("settings.invitationCode", "==", codeIdForPrivateEvents.value));
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
  
  fetchActiveEvents().then(() => {
    // Mostrar los eventos filtrados en la consola
    console.log('Eventos filtrados por computed property:', activeEvents.value.length);
    if (activeEvents.value.length === 0) {
      console.log('No hay eventos activos que mostrar. Verificar configuración de eventos en Firestore.');
    }
  });
  
  if (props.openModalSuccessAfterLogin) {
    openModal(null, 'modalSuccess');
  }
  
  // Añadir event listener para scroll del carrusel
  const carousel = document.getElementById('carousel');
  if (carousel) {
    carousel.addEventListener('scroll', handleCarouselScroll);
  }
});

// Función para determinar el texto del botón según el estado del evento
const getButtonText = (event) => {
  if (!currentUser.value && event.status?.isFinished && event.settings?.isTipAccepted) {
    return "Realizar mi aporte";
  } else if (!event.status?.isFinished && !event.settings?.isPrivate && currentUser.value && !props.isSpectatorSubscribed(event.id) && !event.isUserInEvent) {
    return "Consigue tu ticket en un click";
  } else {
    return "Quiero asistir";
  }
};

// Función para manejar la acción del botón según el estado del evento
const handleEventAction = (event) => {
  if (!currentUser.value && event.status?.isFinished && event.settings?.isTipAccepted) {
    router.push({ name: 'LogIn' });
  } else if (!event.status?.isFinished && !event.settings?.isPrivate && currentUser.value && !props.isSpectatorSubscribed(event.id) && !event.isUserInEvent) {
    openModal(event.id, 'modalValidation');
  } else if (!event.status?.isFinished && !event.settings?.isPrivate && !currentUser.value) {
    router.push({ name: 'Booking', params: { idEvent: event.id } });
  }
};

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