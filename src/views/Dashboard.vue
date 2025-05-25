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
    
    <!-- Tabs para Eventos Activos/Cerrado/Test -->
    <div class="mx-auto max-w-screen-xl mb-4">
      <div class="tabs-boxed w-full">
        <div role="tablist" class="tabs tabs-lifted tab-container w-full">
          <a role="tab" class="tab tab-responsive flex-1" :class="{ 'tab-active bg-gray-200': activeTab === 'activos' }" @click="activeTab = 'activos'">
            <span class="text-black">Activos ({{ filteredActiveEvents.length }})</span>
          </a>
          <a role="tab" class="tab tab-responsive flex-1" :class="{ 'tab-active bg-gray-200': activeTab === 'inactivos' }" @click="activeTab = 'inactivos'">
            <span class="text-black">Cerrado ({{ inactiveEvents.length }})</span>
          </a>
          <a role="tab" class="tab tab-responsive flex-1" :class="{ 'tab-active bg-gray-200': activeTab === 'test' }" @click="activeTab = 'test'">
            <span class="text-black">Test ({{ testEvents.length }})</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Contenido de Eventos Activos -->
    <div v-if="activeTab === 'activos'">
      <div v-if="filteredActiveEvents.length === 0" class="text-center py-8">
        <p class="text-lg text-gray-500">No hay eventos disponibles</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="event in filteredActiveEvents" :key="event.id" class="card bg-base-100 bg-opacity-70 shadow-xl">
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
            
            <!-- Segunda fila: Check-in, Check-out y Pagos -->
            <div class="grid grid-cols-3 gap-2 mt-1">
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-in</div>
                <div class="stat-value text-lg">{{ event.checkinCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-out</div>
                <div class="stat-value text-lg">{{ event.checkoutCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Pagos</div>
                <div class="stat-value text-lg">{{ event.paymentCount || 0 }}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      </div>
    </div>
    
    <!-- Contenido de Eventos Cerrado -->
    <div v-if="activeTab === 'inactivos'">
      <div v-if="inactiveEvents.length === 0" class="text-center py-8">
        <p class="text-lg text-gray-500">No hay eventos disponibles</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="event in inactiveEvents" :key="event.id" class="card bg-base-100 bg-opacity-70 shadow-xl">
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
            
            <!-- Segunda fila: Check-in, Check-out y Pagos -->
            <div class="grid grid-cols-3 gap-2 mt-1">
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-in</div>
                <div class="stat-value text-lg">{{ event.checkinCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-out</div>
                <div class="stat-value text-lg">{{ event.checkoutCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Pagos</div>
                <div class="stat-value text-lg">{{ event.paymentCount || 0 }}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      </div>
    </div>
    
    <!-- Contenido de Eventos Test -->
    <div v-if="activeTab === 'test'">
      <div v-if="testEvents.length === 0" class="text-center py-8">
        <p class="text-lg text-gray-500">No hay eventos disponibles</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="event in testEvents" :key="event.id" class="card bg-base-100 bg-opacity-70 shadow-xl">
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
            
            <!-- Segunda fila: Check-in, Check-out y Pagos -->
            <div class="grid grid-cols-3 gap-2 mt-1">
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-in</div>
                <div class="stat-value text-lg">{{ event.checkinCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Check-out</div>
                <div class="stat-value text-lg">{{ event.checkoutCount || 0 }}</div>
              </div>
              
              <div class="text-center text-gray-600">
                <div class="stat-title text-sm">Pagos</div>
                <div class="stat-value text-lg">{{ event.paymentCount || 0 }}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, defineComponent, computed } from 'vue';
import { 
  collection, 
  getDocs, 
  query, 
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
const allEvents = ref([]);
const isLoading = ref(true);
const activeTab = ref('activos');
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

// Fetch all events based on user authentication status
const fetchActiveEvents = async () => {
  try {
    isLoading.value = true;
    
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    
    // Create query based on authentication status
    let q;
    if (currentUser) {
      // If logged in, show all events (no filters)
      q = query(
        collection(db, "events"),
        orderBy("date", "desc")
      );
    } else {
      // If not logged in, get all events and filter in memory to avoid index requirements
      q = collection(db, "events");
    }

    const querySnapshot = await getDocs(q);
    allEvents.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      spectatorCount: 0,
      checkinCount: 0,
      spectators: []
    }));
    
    // Si no está autenticado, filtrar solo eventos públicos en memoria
    if (!currentUser) {
      allEvents.value = allEvents.value.filter(event => event.settings?.isPrivate === false);
    }
    
    // Ordenar por fecha en memoria para ambos casos
    allEvents.value.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      try {
        return b.date.toDate() - a.date.toDate();
      } catch {
        return 0;
      }
    });
    
    // También mantener activeEvents para compatibilidad
    activeEvents.value = allEvents.value.filter(event => event.settings?.isActive && !event.settings?.isTest);
    
    // Recopilar IDs únicos de venues, hosts y assemblies
    const venueIds = new Set();
    const hostIds = new Set();
    const assemblyIds = new Set();
    
    allEvents.value.forEach(event => {
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
    for (const event of allEvents.value) {
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
      let paymentCount = 0;
      
      // Procesar cada espectador en el evento usando los nuevos campos
      event.zSpectator.forEach(spectator => {
        // Contar estados usando los campos correctos hasCheckIn y hasCheckOut
        if (spectator.hasCheckIn) {
          checkedInCount++;
        }
        if (spectator.hasCheckOut) {
          checkedOutCount++;
        }
        // Contar espectadores que tienen paymentId
        if (spectator.paymentId) {
          paymentCount++;
        }
      });
      
      // Asignar los contadores directamente a las propiedades del evento
      event.checkinCount = checkedInCount;
      event.checkoutCount = checkedOutCount;
      event.paymentCount = paymentCount;
      
      console.log(`Event ${event.id}: ${checkedInCount} check-ins, ${checkedOutCount} check-outs, ${paymentCount} payments`);
    } else {
      // Si no hay zSpectator, inicializar los contadores a cero
      event.checkinCount = 0;
      event.checkoutCount = 0;
      event.paymentCount = 0;
      console.log(`Event ${event.id}: No zSpectator array found`);
    }
  } catch (error) {
    console.error(`Error fetching spectators for event ${event.id}:`, error);
    // En caso de error, asegurar que los contadores existan
    event.checkinCount = 0;
    event.checkoutCount = 0;
    event.paymentCount = 0;
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

// Computed properties para filtrar eventos
const filteredActiveEvents = computed(() => {
  const baseFilter = allEvents.value.filter(event => event.settings?.isActive && !event.settings?.isTest);
  
  // Si no está autenticado, solo mostrar eventos públicos
  if (!isUserLoggedIn.value) {
    return baseFilter.filter(event => event.settings?.isPrivate === false);
  }
  
  return baseFilter;
});

const inactiveEvents = computed(() => {
  const baseFilter = allEvents.value.filter(event => !event.settings?.isActive && !event.settings?.isTest);
  
  // Si no está autenticado, solo mostrar eventos públicos
  if (!isUserLoggedIn.value) {
    return baseFilter.filter(event => event.settings?.isPrivate === false);
  }
  
  return baseFilter;
});

const testEvents = computed(() => {
  const baseFilter = allEvents.value.filter(event => event.settings?.isTest);
  
  // Si no está autenticado, solo mostrar eventos públicos
  if (!isUserLoggedIn.value) {
    return baseFilter.filter(event => event.settings?.isPrivate === false);
  }
  
  return baseFilter;
});

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