<template>
  <NavbarMenu class="mb-6 sm:mb-10" />
  <div class="min-h-screen bg-gray-50 rounded-xl pt-6">
    
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-8">
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-black">Gestión de Eventos</h1>
            <p class="text-gray-600 mt-2 text-sm sm:text-base">Administra todos los eventos del sistema</p>
          </div>
          <button 
            v-if="canCreateEvents()"
            @click="createEvent" 
            class="btn bg-black text-white hover:bg-gray-800 flex-shrink-0 w-full sm:w-auto whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear Evento
          </button>
        </div>
      </div>

      <!-- Verificando autorización -->
      <div v-if="isCheckingAuth" class="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8">
        <div class="flex flex-col items-center justify-center py-12 sm:py-16">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-4 text-black text-sm sm:text-base">Verificando acceso...</p>
        </div>
      </div>

      <!-- Usuario no autorizado -->
      <div v-else-if="!isAuthorized" class="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8">
        <div class="flex justify-center py-8 sm:py-12">
          <div class="w-full max-w-md text-center">
            <h2 class="text-lg sm:text-xl font-bold text-black mb-4">Acceso Restringido</h2>
            <p class="text-black mb-6 text-sm sm:text-base">No tienes permisos para gestionar eventos.</p>
            <button class="btn bg-black text-white hover:bg-gray-800 w-full" @click="logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8">
        <div class="flex flex-col items-center justify-center py-12 sm:py-16">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-4 text-black text-sm sm:text-base">Cargando eventos...</p>
        </div>
      </div>

      <!-- Lista de eventos -->
      <div v-else>
        <!-- Tabs para filtrar eventos -->
        <div class="tabs tabs-boxed w-full mb-6 sm:mb-8 bg-white rounded-xl shadow-xl p-4 sm:p-6">
          <a 
            class="tab flex-1 text-xs sm:text-sm" 
            :class="{ 'tab-active bg-gray-700 text-white': activeTab === 'activos' }" 
            @click="activeTab = 'activos'"
          >
            <span class="hidden sm:inline">Activos </span><span class="sm:hidden">Act. </span>({{ activeEvents.length }})
          </a>
          <a 
            class="tab flex-1 text-xs sm:text-sm" 
            :class="{ 'tab-active bg-gray-700 text-white': activeTab === 'inactivos' }" 
            @click="activeTab = 'inactivos'"
          >
            <span class="hidden sm:inline">Inactivos </span><span class="sm:hidden">Inact. </span>({{ inactiveEvents.length }})
          </a>
          <a 
            class="tab flex-1 text-xs sm:text-sm" 
            :class="{ 'tab-active bg-gray-700 text-white': activeTab === 'test' }" 
            @click="activeTab = 'test'"
          >
            Test ({{ testEvents.length }})
          </a>
        </div>

        <!-- Eventos Activos -->
        <div v-if="activeTab === 'activos'">
          <div v-if="activeEvents.length === 0" class="text-center py-8 sm:py-12">
            <p class="text-base sm:text-lg text-gray-500">No hay eventos activos</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <SimpleEventCard 
              v-for="event in activeEvents" 
              :key="event.id" 
              :event="event"
              :venue-name="getVenueName(event)"
              :assembly-name="getAssemblyName(event)"
              :host-name="getHostName(event)"
              @edit="editEvent"
            />
          </div>
        </div>

        <!-- Eventos Inactivos -->
        <div v-if="activeTab === 'inactivos'">
          <div v-if="inactiveEvents.length === 0" class="text-center py-8 sm:py-12">
            <p class="text-base sm:text-lg text-gray-500">No hay eventos inactivos</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <SimpleEventCard 
              v-for="event in inactiveEvents" 
              :key="event.id" 
              :event="event"
              :venue-name="getVenueName(event)"
              :assembly-name="getAssemblyName(event)"
              :host-name="getHostName(event)"
              @edit="editEvent"
            />
          </div>
        </div>

        <!-- Eventos Test -->
        <div v-if="activeTab === 'test'">
          <div v-if="testEvents.length === 0" class="text-center py-8 sm:py-12">
            <p class="text-base sm:text-lg text-gray-500">No hay eventos de test</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <SimpleEventCard 
              v-for="event in testEvents" 
              :key="event.id" 
              :event="event"
              :venue-name="getVenueName(event)"
              :assembly-name="getAssemblyName(event)"
              :host-name="getHostName(event)"
              @edit="editEvent"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/composables/useAuth';
import NavbarMenu from '@/components/NavbarMenu.vue';
import SimpleEventCard from '@/components/SimpleEventCard.vue';

const router = useRouter();

const { canCreateEvents, canUpdateEvents, isLoading: authLoading, initAuth } = useAuth();
const isAuthorized = computed(() => canCreateEvents() || canUpdateEvents());
const isCheckingAuth = computed(() => authLoading.value);

// Data
const events = ref([]);
const isLoading = ref(true);
const activeTab = ref('activos');

// Names for display
const venueNames = ref({});
const hostNames = ref({});
const assemblyNames = ref({});

// Computed events by status
const activeEvents = computed(() => {
  return events.value.filter(event => event && event.id && event.settings?.isActive && !event.settings?.isTest);
});

const inactiveEvents = computed(() => {
  return events.value.filter(event => event && event.id && !event.settings?.isActive && !event.settings?.isTest);
});

const testEvents = computed(() => {
  return events.value.filter(event => event && event.id && event.settings?.isTest);
});

const logout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
  }
};

const createEvent = () => {
  router.push('/events/create');
};

const editEvent = (eventId) => {
  router.push(`/events/edit/${eventId}`);
};

const getVenueName = (event) => {
  if (event._venueId && venueNames.value[event._venueId]) {
    return venueNames.value[event._venueId];
  }
  if (event.venueId && venueNames.value[event.venueId]) {
    return venueNames.value[event.venueId];
  }
  return "Lugar no disponible";
};

const getHostName = (event) => {
  if (event.hostId && hostNames.value[event.hostId]) {
    return hostNames.value[event.hostId];
  }
  return "";
};

const getAssemblyName = (event) => {
  if (event.assemblyId && assemblyNames.value[event.assemblyId]) {
    return assemblyNames.value[event.assemblyId];
  }
  return "Ensamble no disponible";
};

const loadEvents = async () => {
  try {
    isLoading.value = true;
    
    const querySnapshot = await getDocs(collection(db, "events"));
    const eventsData = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }).filter(event => event && event.id && typeof event.id === 'string');
    
    // Sort by date (newest first)
    eventsData.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      try {
        return b.date.toDate() - a.date.toDate();
      } catch {
        return 0;
      }
    });

    // Update events reactively but safely
    events.value = eventsData;

    await loadRelatedData();
  } catch (error) {
    console.error("Error loading events:", error);
    events.value = []; // Reset to empty array on error
  } finally {
    isLoading.value = false;
  }
};

const loadRelatedData = async () => {
  try {
    // Get unique IDs
    const venueIds = [...new Set(events.value.map(e => e._venueId || e.venueId).filter(Boolean))];
    const hostIds = [...new Set(events.value.map(e => e.hostId).filter(Boolean))];
    const assemblyIds = [...new Set(events.value.map(e => e.assemblyId).filter(Boolean))];

    // Load venues
    for (const venueId of venueIds) {
      try {
        const venueDoc = await getDoc(doc(db, 'venues', venueId));
        if (venueDoc.exists()) {
          venueNames.value[venueId] = venueDoc.data().name || 'Lugar no disponible';
        }
      } catch (error) {
        console.error(`Error fetching venue ${venueId}:`, error);
      }
    }

    // Load hosts
    for (const hostId of hostIds) {
      try {
        const hostDoc = await getDoc(doc(db, 'hosts', hostId));
        if (hostDoc.exists()) {
          hostNames.value[hostId] = hostDoc.data().name || '';
        }
      } catch (error) {
        console.error(`Error fetching host ${hostId}:`, error);
      }
    }

    // Load assemblies
    for (const assemblyId of assemblyIds) {
      try {
        const assemblyDoc = await getDoc(doc(db, 'assembly', assemblyId));
        if (assemblyDoc.exists()) {
          assemblyNames.value[assemblyId] = assemblyDoc.data().name || 'Ensamble no disponible';
        }
      } catch (error) {
        console.error(`Error fetching assembly ${assemblyId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading related data:', error);
  }
};

onMounted(async () => {
  await initAuth();
  
  if (isAuthorized.value) {
    await loadEvents();
  } else {
    router.push('/login');
  }
});
</script>