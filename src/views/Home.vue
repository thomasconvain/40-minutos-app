<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <div class="flex flex-col items-center mb-10">
      <img src="../assets/logo.png" width="150" />
    </div>
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
            <!-- <a class="sm:w-auto w-full" href="https://wa.me/p/27280514998214599/56989612263" target="_blank"> -->
            <button
              v-if="!event.isOver && event.isFreeEntrance"
              type="button"
              class="btn-md mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="
                router.push({ name: 'Booking', params: { idEvent: event.id } })
              "
            >
              <span>Consigue tu ticket aquí</span>
            </button>
            <!-- </a> -->
            <button
              type="button"
              class="btn-md mt-2 sm:w-auto w-full inline-flex justify-center items-center px-4 py-2 border border-white shadow-sm text-sm font-medium rounded-md text-white hover:text-black bg-transparent hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="router.push({ name: 'SignIn' })"
            >
              <span>{{
                event.isOver ? "Realizar mi aporte" : "Ya estoy inscrito"
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
    <div
      class="card w-full bg-base-100 border border-base-600 rounded-lg lg:p-8"
    >
      <div class="card-body">
        <div class="flex items-center gap-6 flex-wrap md:flex-nowrap">
          <div class="responsive-iframe">
            <iframe
              src="https://www.instagram.com/reel/C_k7JOCOj2I/embed"
              frameborder="0"
              allowfullscreen="true"
              scrolling="no"
              allowtransparency="true"
            >
            </iframe>
          </div>
          <div>
            <h2 class="card-title">
              ¿Quieres este evento en tu casa, colegio u oficina?
            </h2>
            <div class="card-actions justify-start mt-4">
              <a href="https://wa.me/56989612263">
                <button class="btn btn-active mt-2">Contáctanos</button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase"; // Asegúrate de que 'db' esté correctamente configurado en tu proyecto
import { format } from "date-fns";
import { es } from "date-fns/locale";

const events = ref([]);
const router = useRouter(); // Importar el enrutador

const fetchActiveEvents = async () => {
  try {
    // Creamos una consulta que filtra los eventos por la clave 'isActive = true'
    const q = query(collection(db, "events"), where("isActive", "==", true));

    const querySnapshot = await getDocs(q);
    events.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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

onMounted(() => {
  fetchActiveEvents();
});
</script>

<style scoped>
.background-circle {
  background-image: url("../assets/gradient_bg.png");
}

.responsive-iframe {
  position: relative;
  width: 100%;
  padding-bottom: 80%; /* Relación de aspecto 4:5 */
  height: 0;
  overflow: hidden;
}

.responsive-iframe iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  /* Asegura que el contenido siempre esté centrado */
  object-fit: cover;
}

@media (max-width: 767px) {
  .responsive-iframe {
    padding-bottom: 145%; /* Relación de aspecto 4:5 */
  }
}
</style>
