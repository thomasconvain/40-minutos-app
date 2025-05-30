<template>
  <div>
    <NavbarMenu class="mb-10" />
    
    <div class="mx-auto max-w-4xl px-4">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-black">
          {{ isEditing ? 'Editar Evento' : 'Crear Nuevo Evento' }}
        </h1>
        <p class="text-gray-600 mt-2">
          {{ isEditing ? 'Modifica los datos del evento' : 'Completa la información para crear un nuevo evento' }}
        </p>
      </div>

      <!-- Verificando autorización -->
      <div v-if="isCheckingAuth" class="text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-2 text-black">Verificando acceso...</p>
      </div>

      <!-- Usuario no autorizado -->
      <div v-else-if="!isAuthorized" class="text-center py-8">
        <div class="mx-auto w-full max-w-screen-xl rounded-2xl bg-white p-6 md:p-8 shadow-xl">
          <h2 class="text-xl font-bold text-black mb-4">Acceso Restringido</h2>
          <p class="text-black mb-4">No tienes permisos para crear o editar eventos.</p>
          <button class="btn bg-black text-white hover:bg-gray-800" @click="logout">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <!-- Formulario autorizado -->
      <div v-else>
        <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-xl p-6">
          <!-- Información Básica -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-black mb-4">Información Básica</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Fecha y Hora -->
              <div class="md:col-span-2">
                <label class="label">
                  <span class="label-text font-medium">Fecha y Hora</span>
                </label>
                <input 
                  type="datetime-local" 
                  v-model="form.date" 
                  class="input input-bordered w-full"
                  required
                />
              </div>

              <!-- Assembly -->
              <div>
                <label class="label">
                  <span class="label-text font-medium">Ensamble</span>
                </label>
                <select v-model="form.assemblyId" class="select select-bordered w-full" required>
                  <option value="">Seleccionar Ensamble</option>
                  <option v-for="assembly in assemblies" :key="assembly.id" :value="assembly.id">
                    {{ assembly.name }}
                  </option>
                </select>
              </div>

              <!-- Host -->
              <div>
                <label class="label">
                  <span class="label-text font-medium">Anfitrión</span>
                </label>
                <select v-model="form.hostId" class="select select-bordered w-full" required>
                  <option value="">Seleccionar Anfitrión</option>
                  <option v-for="host in hosts" :key="host.id" :value="host.id">
                    {{ host.name }}
                  </option>
                </select>
              </div>

              <!-- Venue -->
              <div>
                <label class="label">
                  <span class="label-text font-medium">Lugar</span>
                </label>
                <select v-model="form.venueId" class="select select-bordered w-full" required>
                  <option value="">Seleccionar Lugar</option>
                  <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                    {{ venue.name }}
                  </option>
                </select>
              </div>

              <!-- Content Reference -->
              <div>
                <label class="label">
                  <span class="label-text font-medium">Contenido</span>
                </label>
                <select v-model="form.contentReferenceId" class="select select-bordered w-full">
                  <option value="">Seleccionar Contenido</option>
                  <option v-for="content in contents" :key="content.id" :value="content.id">
                    {{ content.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Configuraciones -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-black mb-4">Configuraciones</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Código de Invitación -->
              <div class="md:col-span-2">
                <label class="label">
                  <span class="label-text font-medium">Código de Invitación</span>
                </label>
                <input 
                  type="text" 
                  v-model="form.settings.invitationCode" 
                  class="input input-bordered w-full"
                  placeholder="Código único para el evento"
                />
              </div>

              <!-- Switches -->
              <div class="space-y-4">
                <div class="form-control">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" v-model="form.settings.isActive" class="checkbox checkbox-primary mr-3" />
                    <span class="label-text">Evento Activo</span>
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" v-model="form.settings.isPrivate" class="checkbox checkbox-primary mr-3" />
                    <span class="label-text">Evento Privado</span>
                  </label>
                </div>
              </div>

              <div class="space-y-4">
                <div class="form-control">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" v-model="form.settings.isTipAccepted" class="checkbox checkbox-primary mr-3" />
                    <span class="label-text">Acepta Propinas</span>
                  </label>
                </div>

                <div class="form-control">
                  <label class="label cursor-pointer justify-start">
                    <input type="checkbox" v-model="form.settings.isTest" class="checkbox checkbox-primary mr-3" />
                    <span class="label-text">Evento de Prueba</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado del Evento -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-black mb-4">Estado del Evento</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div class="form-control">
                <label class="label cursor-pointer justify-start">
                  <input type="checkbox" v-model="form.status.isReservationOpen" class="checkbox checkbox-primary mr-3" />
                  <span class="label-text">Reservas Abiertas</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer justify-start">
                  <input type="checkbox" v-model="form.status.isCheckinOpen" class="checkbox checkbox-primary mr-3" />
                  <span class="label-text">Check-in Abierto</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label cursor-pointer justify-start">
                  <input type="checkbox" v-model="form.status.isFinished" class="checkbox checkbox-primary mr-3" />
                  <span class="label-text">Evento Finalizado</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Métodos de Pago -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-black mb-4">Métodos de Pago</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="method in paymentMethods" :key="method.id" class="form-control">
                <label class="label cursor-pointer justify-start">
                  <input 
                    type="checkbox" 
                    :value="method.id"
                    v-model="form.paymentMethodIds" 
                    class="checkbox checkbox-primary mr-3" 
                  />
                  <span class="label-text">{{ method.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="flex justify-end gap-4 pt-6 border-t">
            <button 
              type="button" 
              @click="cancel" 
              class="btn btn-ghost"
              :disabled="isSubmitting"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner loading-sm mr-2"></span>
              {{ isEditing ? 'Actualizar Evento' : 'Crear Evento' }}
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
    isCheckinOpen: false,
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
    router.push('/login');
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
      
      // Convert Firestore Timestamp to datetime-local format
      const date = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);
      const formattedDate = date.toISOString().slice(0, 16);
      
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
          isCheckinOpen: eventData.status?.isCheckinOpen ?? false,
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
      paymentMethodIds: form.value.paymentMethodIds,
      zSpectator: []
    };

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