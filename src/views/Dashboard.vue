<template>
  <div>
    <div class="flex justify-between items-center mb-2">
      <div>
        <h1 class="text-2xl font-bold">Dashboard de Eventos</h1>
        <div class="flex mt-1 text-sm text-gray-500">
        </div>
      </div>
      <div>
        <button v-if="isUserLoggedIn" class="btn bg-white border-none" @click="logout">
          Cerrar sesión
        </button>
      </div>
    </div>
        
    <!-- Events Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="event in activeEvents" :key="event.id" class="card bg-base-100 bg-opacity-70 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ event.place || event.name || event.hostName }}</h2>
          
          <div class="flex mt-1 mb-1 text-sm text-gray-500">
            {{ formatDate(event.date) }}
          </div>
          
          <div class="divider my-0"></div>
          
          <div class="flex flex-col gap-1 mt-1">
            <!-- Primera fila: Inscritos y Reservas -->
            <div class="grid grid-cols-2 gap-2">
              <div class="text-center p-1 bg-primary/10 rounded-md">
                <div class="stat-title text-black">Inscritos</div>
                <div class="stat-value text-xl text-black">{{ calculateTotalReservations(event)  }}</div>
              </div>
              
              <div class="text-center">
                <div class="stat-title">Reservas</div>
                <div class="stat-value text-xl">{{ event.eventSpectators?.length || 0 }}</div>
              </div>
            </div>
            
            <!-- Segunda fila: Check-in y Check-out -->
            <div class="grid grid-cols-2 gap-2 mt-1">
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-in</div>
                <div class="stat-value text-lg">{{ event.checkinCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-out</div>
                <div class="stat-value text-lg">{{ event.checkoutCount || 0 }}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, defineComponent } from 'vue';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Para evitar error vue/multi-word-component-names
defineComponent({
  name: 'EventsDashboard'
});

const router = useRouter();
const activeEvents = ref([]);
const isLoading = ref(true);

// Función para formatear la fecha
const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return "Fecha no disponible";
  }
  return format(timestamp.toDate(), "EEEE dd 'de' MMMM '|' HH.mm 'hrs'", {
    locale: es,
  });
};

// Fetch active events based on user authentication status
const fetchActiveEvents = async () => {
  try {
    isLoading.value = true;
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    
    // Create query based on authentication status
    let q;
    if (currentUser) {
      // If logged in, show all active events
      q = query(
        collection(db, "events"),
        where("isActive", "==", true),
        orderBy("date", "asc")
      );
    } else {
      // If not logged in, only show public events (isFreeEntrance == true)
      q = query(
        collection(db, "events"),
        where("isActive", "==", true),
        where("isFreeEntrance", "==", true),
        orderBy("date", "asc")
      );
    }

    const querySnapshot = await getDocs(q);
    activeEvents.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      spectatorCount: 0,
      checkinCount: 0,
      spectators: []
    }));

    // Fetch spectator counts for each event
    for (const event of activeEvents.value) {
      await fetchEventSpectators(event);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  } finally {
    isLoading.value = false;
  }
};

// Fetch spectators for a specific event
const fetchEventSpectators = async (event) => {
  try {
    // Get spectators from the event's eventSpectators array
    if (event.eventSpectators && Array.isArray(event.eventSpectators)) {
      event.spectatorCount = event.eventSpectators.length;
      
      // Contar directamente desde el arreglo eventSpectators
      let checkinCount = 0;
      let checkoutCount = 0;
      let wasCheckedInCount = 0;
      let wasCheckedOutCount = 0;
      
      // Procesar cada espectador en el evento
      event.eventSpectators.forEach(spectator => {
        // Contar estados actuales
        if (spectator.isChecked) {
          checkinCount++;
        }
        if (spectator.isCheckedOut) {
          checkoutCount++;
        }
        
        // Contar estados históricos
        if (spectator.wasCheckedIn) {
          wasCheckedInCount++;
        }
        if (spectator.wasCheckedOut) {
          wasCheckedOutCount++;
        }
      });
      
      // Obtener datos actualizados de los espectadores
      const spectatorsRef = collection(db, 'spectators');
      const q = query(spectatorsRef, where('subscribedEventsId', 'array-contains', event.id));
      const querySnapshot = await getDocs(q);
      
      const eventRef = doc(db, 'events', event.id);
      let needsUpdate = false;
      
      // Crear una copia para actualizar
      const updatedSpectators = [...event.eventSpectators];
      
      // Actualizar cada espectador con datos de Firestore
      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        
        // Buscar el espectador en el array
        const spectatorIndex = updatedSpectators.findIndex(s => s.id === docSnapshot.id);
        
        if (spectatorIndex >= 0) {
          const currentSpectator = updatedSpectators[spectatorIndex];
          
          // Verificar si hay cambios en el estado de check-in o check-out
          const hasNewCheckin = data.isChecked && !currentSpectator.wasCheckedIn;
          const hasNewCheckout = data.isCheckedOut && !currentSpectator.wasCheckedOut;
          
          // Actualizar datos
          if (hasNewCheckin || hasNewCheckout) {
            updatedSpectators[spectatorIndex] = {
              ...currentSpectator,
              isChecked: data.isChecked || false,
              isCheckedOut: data.isCheckedOut || false,
              wasCheckedIn: hasNewCheckin ? true : (currentSpectator.wasCheckedIn || false),
              wasCheckedOut: hasNewCheckout ? true : (currentSpectator.wasCheckedOut || false),
            };
            
            needsUpdate = true;
          }
        }
      });
      
      // Actualizar Firestore si es necesario
      if (needsUpdate) {
        try {
          await updateDoc(eventRef, {
            eventSpectators: updatedSpectators
          });
          console.log('Estado de check-in/out actualizado para el evento:', event.id);
          
          // Actualizar los contadores después de guardar
          wasCheckedInCount = updatedSpectators.filter(s => s.wasCheckedIn).length;
          wasCheckedOutCount = updatedSpectators.filter(s => s.wasCheckedOut).length;
        } catch (error) {
          console.error('Error al actualizar los datos de check-in/out:', error);
        }
      }
      
      // Actualizar los contadores en el objeto del evento para visualización
      event.checkinCount = wasCheckedInCount;  // Usar wasCheckedIn en lugar de isChecked
      event.checkoutCount = wasCheckedOutCount;  // Usar wasCheckedOut en lugar de isCheckedOut
      event.currentCheckinCount = checkinCount;  // Guardar estos por si acaso
      event.currentCheckoutCount = checkoutCount;
    }
  } catch (error) {
    console.error(`Error fetching spectators for event ${event.id}:`, error);
  }
};

// Calculate total reservations including companions
const calculateTotalReservations = (event) => {
  let total = 0;
  if (event.eventSpectators && Array.isArray(event.eventSpectators)) {
    total = event.eventSpectators.reduce((sum, spectator) => {
      // Count the spectator (1) plus any companions
      const companions = spectator.numberOfCompanions || 0;
      return sum + 1 + companions;
    }, 0);
  }
  return total;
};

// Log out function
const logout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// Variable para controlar si se necesita mostrar el botón de login/logout
const isUserLoggedIn = ref(false);
const authMessage = ref('');

// Actualizar UI cuando cambia el estado de autenticación
onMounted(() => {
  // Escuchar cambios en la autenticación
  onAuthStateChanged(auth, (user) => {
    isUserLoggedIn.value = !!user;
    authMessage.value = '';
    fetchActiveEvents();
  });
});
</script>