<template>
  <NavbarMenu class="mb-6 sm:mb-10" />
  <div class="min-h-screen bg-gray-50 rounded-xl pt-6">
    
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-8">
      <div class="mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
          {{ isEditing ? 'Editar Evento' : 'Crear Nuevo Evento' }}
        </h1>
        <p class="text-gray-600 mt-2 text-sm sm:text-base">
          {{ isEditing ? 'Modifica los datos del evento' : 'Completa la información para crear un nuevo evento' }}
        </p>
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
            <p class="text-black mb-6 text-sm sm:text-base">No tienes permisos para crear o editar eventos.</p>
            <button class="btn bg-black text-white hover:bg-gray-800 w-full" @click="logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <!-- Formulario autorizado -->
      <div v-else class="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8">
        <form @submit.prevent="handleSubmit">
          <!-- Información Básica -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 border-b border-gray-200 pb-2">
              📅 Información Básica
            </h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              <!-- Fecha y Hora -->
              <div class="lg:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora *
                </label>
                <input 
                  type="datetime-local" 
                  v-model="form.date" 
                  class="input input-bordered w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  required
                />
              </div>

              <!-- Assembly -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  🎵 Ensamble *
                </label>
                <select v-model="form.assemblyId" class="select select-bordered w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required>
                  <option value="">Seleccionar Ensamble</option>
                  <option v-for="assembly in assemblies" :key="assembly.id" :value="assembly.id">
                    {{ assembly.name }}
                  </option>
                </select>
              </div>

              <!-- Host -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  👤 Anfitrión *
                </label>
                <select v-model="form.hostId" class="select select-bordered w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required>
                  <option value="">Seleccionar Anfitrión</option>
                  <option v-for="host in hosts" :key="host.id" :value="host.id">
                    {{ host.name }}
                  </option>
                </select>
              </div>

              <!-- Venue -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  📍 Lugar *
                </label>
                <select v-model="form.venueId" class="select select-bordered w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500" required>
                  <option value="">Seleccionar Lugar</option>
                  <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                    {{ venue.name }}
                  </option>
                </select>
              </div>

              <!-- Content Reference -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  📝 Contenido
                </label>
                <select v-model="form.contentReferenceId" class="select select-bordered w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
                  <option value="">Seleccionar Contenido</option>
                  <option v-for="content in contents" :key="content.id" :value="content.id">
                    {{ content.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Configuraciones -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 border-b border-gray-200 pb-2">
              ⚙️ Configuraciones
            </h2>
            <div class="space-y-4 sm:space-y-6">
              
              <!-- Código de Invitación -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  🔑 Código de Invitación
                </label>
                <input 
                  type="text" 
                  v-model="form.settings.invitationCode" 
                  class="input input-bordered w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Código único para el evento"
                />
              </div>

              <!-- Switches en grid responsivo -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" v-model="form.settings.isActive" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                      <div>
                        <span class="label-text font-medium">Evento Activo</span>
                        <p class="text-xs text-gray-500 mt-1">El evento aparecerá en listados públicos</p>
                      </div>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" v-model="form.settings.isPrivate" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                      <div>
                        <span class="label-text font-medium">Evento Privado</span>
                        <p class="text-xs text-gray-500 mt-1">Solo accesible con código de invitación</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" v-model="form.settings.isTipAccepted" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                      <div>
                        <span class="label-text font-medium">Acepta Propinas</span>
                        <p class="text-xs text-gray-500 mt-1">Los espectadores pueden hacer aportes</p>
                      </div>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" v-model="form.settings.isTest" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                      <div>
                        <span class="label-text font-medium">Evento de Prueba</span>
                        <p class="text-xs text-gray-500 mt-1">Marcado como evento de testing</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado del Evento -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 border-b border-gray-200 pb-2">
              📊 Estado del Evento
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" v-model="form.status.isReservationOpen" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                  <div>
                    <span class="label-text font-medium">Reservas Abiertas</span>
                    <p class="text-xs text-gray-500 mt-1">Los usuarios pueden registrarse</p>
                  </div>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" v-model="form.status.isCheckInOpen" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                  <div>
                    <span class="label-text font-medium">Check-in Abierto</span>
                    <p class="text-xs text-gray-500 mt-1">Espectadores pueden hacer check-in</p>
                  </div>
                </label>
              </div>

              <div class="form-control sm:col-span-2 lg:col-span-1">
                <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" v-model="form.status.isFinished" class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" />
                  <div>
                    <span class="label-text font-medium">Evento Finalizado</span>
                    <p class="text-xs text-gray-500 mt-1">El evento ha terminado</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Métodos de Pago -->
          <div class="mb-6 sm:mb-8">
            <h2 class="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4 border-b border-gray-200 pb-2">
              💳 Métodos de Pago
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="method in paymentMethods" :key="method.id" class="form-control">
                <label class="label cursor-pointer justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    :value="method.id"
                    v-model="form.paymentMethodIds" 
                    class="checkbox border-gray-700 [--chkbg:theme(colors.gray.700)] [--chkfg:white]" 
                  />
                  <span class="label-text font-medium">{{ method.paymentType || method.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
            <button 
              type="button" 
              @click="cancel" 
              class="btn btn-ghost order-2 sm:order-1 flex-1 sm:flex-none"
              :disabled="isSubmitting"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn bg-black text-white hover:bg-gray-800 order-1 sm:order-2 flex-1 sm:flex-none whitespace-nowrap"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm mr-2"></span>
              <span class="truncate">{{ isEditing ? 'Actualizar Evento' : 'Crear Evento' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/composables/useAuth';
import NavbarMenu from '@/components/NavbarMenu.vue';

const router = useRouter();
const route = useRoute();

const isEditing = computed(() => !!route.params.id);
const eventId = computed(() => route.params.id);

const { canCreateEvents, canUpdateEvents, isLoading: authLoading, initAuth } = useAuth();
const isAuthorized = computed(() => isEditing.value ? canUpdateEvents() : canCreateEvents());
const isCheckingAuth = computed(() => authLoading.value);

// Form data
const form = ref({
  date: '',
  assemblyId: '',
  hostId: '',
  venueId: '',
  contentReferenceId: '',
  settings: {
    invitationCode: '',
    isActive: true,
    isPrivate: false,
    isTipAccepted: false,
    isTest: false
  },
  status: {
    isReservationOpen: true,
    isCheckInOpen: false,
    isFinished: false
  },
  paymentMethodIds: []
});

// Loading states
const isSubmitting = ref(false);
const isLoading = ref(true);

// Data for selects
const assemblies = ref([]);
const hosts = ref([]);
const venues = ref([]);
const contents = ref([]);
const paymentMethods = ref([]);

const logout = async () => {
  try {
    await signOut(auth);
    router.push('/');
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
  }
};

const loadSelectData = async () => {
  try {
    const [
      assembliesSnapshot,
      hostsSnapshot,
      venuesSnapshot,
      contentsSnapshot,
      paymentMethodsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'assembly')),
      getDocs(collection(db, 'hosts')),
      getDocs(collection(db, 'venues')),
      getDocs(collection(db, 'content-manager')),
      getDocs(collection(db, 'payment-methods'))
    ]);

    assemblies.value = assembliesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    hosts.value = hostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    venues.value = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    contents.value = contentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    paymentMethods.value = paymentMethodsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading select data:', error);
  }
};

const loadEventData = async () => {
  if (!isEditing.value) return;
  
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId.value));
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      
      // Convert Firestore Timestamp to datetime-local format preserving local timezone
      const date = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
      
      // Format date for datetime-local input (YYYY-MM-DDTHH:MM) in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      form.value = {
        date: formattedDate,
        assemblyId: eventData.assemblyId || '',
        hostId: eventData.hostId || '',
        venueId: eventData.venueId || eventData._venueId || '',
        contentReferenceId: eventData.contentReferenceId || '',
        settings: {
          invitationCode: eventData.settings?.invitationCode || '',
          isActive: eventData.settings?.isActive ?? true,
          isPrivate: eventData.settings?.isPrivate ?? false,
          isTipAccepted: eventData.settings?.isTipAccepted ?? false,
          isTest: eventData.settings?.isTest ?? false
        },
        status: {
          isReservationOpen: eventData.status?.isReservationOpen ?? true,
          isCheckInOpen: eventData.status?.isCheckInOpen ?? false,
          isFinished: eventData.status?.isFinished ?? false
        },
        paymentMethodIds: eventData.paymentMethodIds || []
      };
    }
  } catch (error) {
    console.error('Error loading event data:', error);
  }
};

const handleSubmit = async () => {
  if (!isAuthorized.value) return;
  
  isSubmitting.value = true;
  
  try {
    const eventData = {
      assemblyId: form.value.assemblyId,
      hostId: form.value.hostId,
      _venueId: form.value.venueId,
      venueId: form.value.venueId,
      contentReferenceId: form.value.contentReferenceId,
      date: Timestamp.fromDate(new Date(form.value.date)),
      settings: form.value.settings,
      status: form.value.status,
      paymentMethodIds: form.value.paymentMethodIds
    };

    // Solo agregar zSpectator vacío para eventos nuevos, no para ediciones
    if (!isEditing.value) {
      eventData.zSpectator = [];
    }

    if (isEditing.value) {
      await updateDoc(doc(db, 'events', eventId.value), eventData);
      console.log('Event updated successfully');
    } else {
      await addDoc(collection(db, 'events'), eventData);
      console.log('Event created successfully');
    }

    router.push('/events');
  } catch (error) {
    console.error('Error saving event:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const cancel = () => {
  router.push('/events');
};

onMounted(async () => {
  await initAuth();
  
  if (isAuthorized.value) {
    await loadSelectData();
    await loadEventData();
  } else {
    router.push('/login');
  }
  
  isLoading.value = false;
});
</script>