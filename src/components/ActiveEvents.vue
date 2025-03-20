<template>
    <div>
        <section v-for="event in events" :key="event.id" class="py-8">
      <div
        class="mx-auto grid max-w-screen-xl rounded-lg bg-black p-8 md:p-8 lg:grid-cols-12 lg:gap-8 lg:p-16 xl:gap-16 background-circle"
      >
        <div class="me-auto place-self-center lg:col-span-7">
          <h1
            class="mb-3 text-2xl font-bold leading-tight tracking-tight text-white md:text-4xl"
          >
            {{ event.name }}<br />
            {{ convertTimestamp(event.date) }}
          </h1>
          <p v-if="event.isOver" class="mb-6 text-gray-100">
            Evento terminado. Si aún no realizaste tu aporte puedes hacerlo
            haciendo click en el siguiente botón.
          </p>
          <p v-else-if="event.isFreeEntrance" class="mb-6 text-gray-100">
            {{ event.place }}
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              v-if="!event.isOver && event.isFreeEntrance && !currentUser"
              type="button"
              class="btn-md mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="
                router.push({ name: 'SignIn', params: { idEvent: event.id } })
              "
            >
              <span>Consigue tu ticket aquí</span>
            </button>
            <button
              v-if="!event.isOver && event.isFreeEntrance && currentUser && !isSpectatorSubscribed(event.id)"
              type="button"
              class="btn-md mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="openModal"
            >
              <span>Consigue tu ticket en un click</span>
            </button>
            <dialog id="modalValidation" class="modal">
                <div class="modal-box">
                    <h3 class="text-lg font-bold">¿Cuantas personas asistirán en total?</h3>
                    <input v-model="numberOfPeople" type="number" min="1" placeholder="Ingresa el número de participantes" class="input input-bordered w-full mt-4" />
                    <form method="dialog">
                        <button
                            class="btn-md btn btn-primary text-white w-full mt-4"
                            @click="addSubscribedEvent(event.id)">
                            Me inscribo
                        </button>
                    </form>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
            <div v-if="isSpectatorSubscribed(event.id)" class="text-white flex items-center">
                <CheckCircleIcon v-if="!isLoading" class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
                Ya estas inscrito a este evento</div>
            <button
            v-if="!currentUser && event.isOver"
              type="button"
              class="btn-md mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-white shadow-sm text-sm font-medium rounded-md text-white hover:text-black bg-transparent hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="router.push({ name: 'SignIn' })"
            >
              <span>Realizar mi aporte</span>
            </button>
          </div>
        </div>
      </div>
    </section>
    </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, onMounted, defineEmits, defineProps } from "vue";
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
});

const events = ref([]);
const router = useRouter();

const currentUser = ref(null);
const numberOfPeople = ref(1);
const modalValidation = ref(null);

const fetchActiveEvents = async () => {
  try {
    const q = query(
      collection(db, "events"),
      where("isActive", "==", true),
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

const openModal = () => {
  modalValidation.value = document.getElementById("modalValidation");
  modalValidation.value.showModal();
};

onMounted(() => {
    onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
  }),
  fetchActiveEvents();
});
</script>

<style scoped>

</style>