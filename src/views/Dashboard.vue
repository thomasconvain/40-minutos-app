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
          <h2 class="card-title">{{ venueName(event) || assemblyName(event) || hostName(event) }}</h2>
          
          <div class="flex mt-1 mb-1 text-sm text-gray-500">
            {{ formatDate(event.date) }}
          </div>
          
          <div class="divider my-0"></div>
          
          <div class="flex flex-col gap-1 mt-1">
            <!-- Primera fila: Inscritos y Reservas -->
            <div class="grid grid-cols-2 gap-2">
              <div class="text-center p-1 bg-primary/10 rounded-md">
                <div class="stat-title text-black">Inscritos</div>
                <div class="stat-value text-xl text-black">{{ calculateTotalReservations(event) }}</div>
              </div>
              
              <div class="text-center">
                <div class="stat-title">Reservas</div>
                <div class="stat-value text-xl">{{ event.zSpectator?.length || 0 }}</div>
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
  getDoc
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
// Definir venueNames, hostNames y assemblyNames antes de usarlos
const venueNames = ref({});
const hostNames = ref({});
const assemblyNames = ref({});

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
        where("settings.isActive", "==", true),
        orderBy("date", "asc")
      );
    } else {
      // If not logged in, only show public events (settings.isPrivate == false)
      q = query(
        collection(db, "events"),
        where("settings.isActive", "==", true),
        where("settings.isPrivate", "==", false),
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
    
    // Recopilar IDs únicos de venues, hosts y assemblies
    const venueIds = new Set();
    const hostIds = new Set();
    const assemblyIds = new Set();
    
    activeEvents.value.forEach(event => {
      if (event._venueId) venueIds.add(event._venueId);
      if (event.hostId) hostIds.add(event.hostId);
      if (event.assemblyId) assemblyIds.add(event.assemblyId);
    });
    
    // Cargar datos de venues
    if (venueIds.size > 0) {
      const venuePromises = Array.from(venueIds).map(async (venueId) => {
        try {
          const venueDoc = await getDoc(doc(db, 'venues', venueId));
          if (venueDoc.exists()) {
            venueNames.value[venueId] = venueDoc.data().name || 'Lugar no disponible';
          }
        } catch (error) {
          console.error(`Error fetching venue ${venueId}:`, error);
        }
      });
      await Promise.all(venuePromises);
    }
    
    // Cargar datos de hosts
    if (hostIds.size > 0) {
      const hostPromises = Array.from(hostIds).map(async (hostId) => {
        try {
          const hostDoc = await getDoc(doc(db, 'hosts', hostId));
          if (hostDoc.exists()) {
            hostNames.value[hostId] = hostDoc.data().name || '';
          }
        } catch (error) {
          console.error(`Error fetching host ${hostId}:`, error);
        }
      });
      await Promise.all(hostPromises);
    }
    
    // Cargar datos de assemblies
    if (assemblyIds.size > 0) {
      const assemblyPromises = Array.from(assemblyIds).map(async (assemblyId) => {
        try {
          const assemblyDoc = await getDoc(doc(db, 'assembly', assemblyId));
          if (assemblyDoc.exists()) {
            assemblyNames.value[assemblyId] = assemblyDoc.data().name || 'Ensamble no disponible';
          }
        } catch (error) {
          console.error(`Error fetching assembly ${assemblyId}:`, error);
        }
      });
      await Promise.all(assemblyPromises);
    }

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
    // Get spectators from the new zSpectator array structure
    if (event.zSpectator && Array.isArray(event.zSpectator)) {
      event.spectatorCount = event.zSpectator.length;
      
      // Contar directamente desde el arreglo zSpectator 
      let checkedInCount = 0;
      let checkedOutCount = 0;
      
      // Procesar cada espectador en el evento usando los nuevos campos
      event.zSpectator.forEach(spectator => {
        // Contar estados usando los campos correctos hasCheckIn y hasCheckOut
        if (spectator.hasCheckIn) {
          checkedInCount++;
        }
        if (spectator.hasCheckOut) {
          checkedOutCount++;
        }
      });
      
      // Asignar los contadores directamente a las propiedades del evento
      event.checkinCount = checkedInCount;
      event.checkoutCount = checkedOutCount;
      
      console.log(`Event ${event.id}: ${checkedInCount} check-ins, ${checkedOutCount} check-outs`);
    } else {
      // Si no hay zSpectator, inicializar los contadores a cero
      event.checkinCount = 0;
      event.checkoutCount = 0;
      console.log(`Event ${event.id}: No zSpectator array found`);
    }
  } catch (error) {
    console.error(`Error fetching spectators for event ${event.id}:`, error);
    // En caso de error, asegurar que los contadores existan
    event.checkinCount = 0;
    event.checkoutCount = 0;
  }
};

// Estas variables ya fueron definidas anteriormente

// Funciones para obtener nombres de entidades relacionadas
const venueName = (event) => {
  if (event._venueId && venueNames.value[event._venueId]) {
    return venueNames.value[event._venueId];
  }
  return "Lugar no disponible";
};

const hostName = (event) => {
  if (event.hostId && hostNames.value[event.hostId]) {
    return hostNames.value[event.hostId];
  }
  return "";
};

const assemblyName = (event) => {
  if (event.assemblyId && assemblyNames.value[event.assemblyId]) {
    return assemblyNames.value[event.assemblyId];
  }
  return "Ensamble no disponible";
};

// Calculate total reservations including companions with new data structure
const calculateTotalReservations = (event) => {
  let total = 0;
  if (event.zSpectator && Array.isArray(event.zSpectator)) {
    total = event.zSpectator.reduce((sum, spectator) => {
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