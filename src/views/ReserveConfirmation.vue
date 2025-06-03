<template>
  <div>
    <NavbarMenu />
    
    <h1 class="text-2xl font-bold mb-6">¡Reserva confirmada!</h1>
    
    <!-- Primer mensaje informativo sobre la reserva - verde con check icon en círculo -->
    <div 
      v-if="!infoReserveDismissed" 
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import NavbarMenu from '@/components/NavbarMenu.vue';
import { 
  getFirestore, 
  doc, 
  getDoc, 
} from "firebase/firestore";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";

// Estado de la aplicación
const spectator = ref(null);
const infoReserveDismissed = ref(false);

// Router y parámetros
const route = useRoute();
const idSpectator = route.params.idSpectator;

// Inicialización principal
onMounted(() => {
  fetchSpectator();
});

// Función para obtener los datos del espectador desde Firestore
const fetchSpectator = async () => {
  const db = getFirestore();
  const docRef = doc(db, "spectators", idSpectator);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
    } else {
      console.error("No se encontró el documento con el ID proporcionado");
    }
  } catch (error) {
    console.error("Error al obtener los datos del espectador:", error);
  }
};
  

// Función para ocultar el mensaje informativo de reserva y redirigir a URL externa
const dismissReserveInfo = () => {
  infoReserveDismissed.value = true;
  window.location.href = 'https://www.40minutos.com/';
};

</script>

<style scoped></style>