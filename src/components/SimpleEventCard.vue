<template>
  <div class="card bg-white shadow-xl hover:shadow-2xl transition-shadow duration-200">
    <div class="card-body p-4 sm:p-6">
      <!-- Header con estado y acciones -->
      <div class="flex justify-between items-start mb-4">
        <div class="flex flex-wrap gap-2">
          <div class="badge badge-sm" :class="getBadgeClass()">
            {{ getStatusText() }}
          </div>
          <div v-if="isTest" class="badge badge-sm badge-warning">Test</div>
          <div v-if="isPrivate" class="badge badge-sm bg-blue-600 text-white">Privado</div>
        </div>
        <button @click="handleEdit" class="btn btn-ghost btn-sm hover:bg-gray-100" title="Editar evento">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <!-- Título del evento -->
      <div class="mb-4">
        <h2 class="card-title text-lg sm:text-xl font-bold text-black mb-1">{{ eventTitle }}</h2>
        <p class="text-sm text-gray-600">{{ assemblyName || 'Sin ensamble' }}</p>
      </div>

      <!-- Fecha -->
      <div class="mb-4">
        <div class="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="font-medium">{{ eventDate }}</span>
        </div>
      </div>


      <!-- Estado de operaciones -->
      <div class="flex flex-wrap gap-2 mb-4">
        <div class="badge badge-sm" :class="reservationsOpen ? 'bg-gray-700 text-white' : 'badge-neutral'">
          {{ reservationsOpen ? 'Reservas: Abiertas' : 'Reservas: Cerradas' }}
        </div>
        <div class="badge badge-sm" :class="checkinOpen ? 'bg-gray-700 text-white' : 'badge-neutral'">
          {{ checkinOpen ? 'Check-in: Abierto' : 'Check-in: Cerrado' }}
        </div>
        <div class="badge badge-sm" :class="finished ? 'badge-error' : 'badge-neutral'">
          {{ finished ? 'Finalizado' : 'En curso' }}
        </div>
      </div>

      <!-- Información adicional -->
      <div class="space-y-2 text-sm">
        <div v-if="invitationCode" class="flex items-center gap-2 text-gray-600">
          <span class="font-medium text-gray-700">Código:</span>
          <span class="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{{ invitationCode }}</span>
        </div>
        <div v-if="hostName" class="flex items-center gap-2 text-gray-600">
          <span class="font-medium text-gray-700">Anfitrión:</span>
          <span>{{ hostName }}</span>
        </div>
        <div v-if="paymentMethods > 0" class="flex items-center gap-2 text-gray-600">
          <span class="font-medium text-gray-700">Métodos de pago:</span>
          <span class="bg-gray-700 text-white px-2 py-1 rounded-full text-xs">{{ paymentMethods }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { format } from "date-fns";
import { es } from "date-fns/locale";

const props = defineProps({
  event: {
    type: Object,
    default: () => ({})
  },
  venueName: {
    type: String,
    default: ''
  },
  assemblyName: {
    type: String,
    default: ''
  },
  hostName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['edit']);

// Computed properties con valores por defecto seguros
const eventTitle = computed(() => {
  return props.venueName || props.assemblyName || props.hostName || 'Evento sin nombre';
});

const eventDate = computed(() => {
  try {
    if (props.event?.date && typeof props.event.date.toDate === 'function') {
      return format(props.event.date.toDate(), "dd/MM/yyyy HH:mm", { locale: es });
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
  }
  return "Fecha no disponible";
});


const isTest = computed(() => Boolean(props.event?.settings?.isTest));
const isPrivate = computed(() => Boolean(props.event?.settings?.isPrivate));
const isActive = computed(() => Boolean(props.event?.settings?.isActive));

const reservationsOpen = computed(() => Boolean(props.event?.status?.isReservationOpen));
const checkinOpen = computed(() => Boolean(props.event?.status?.isCheckinOpen));
const finished = computed(() => Boolean(props.event?.status?.isFinished));

const invitationCode = computed(() => props.event?.settings?.invitationCode || '');
const paymentMethods = computed(() => props.event?.paymentMethodIds?.length || 0);

// Funciones de utilidad
const getStatusText = () => {
  if (isTest.value) return 'Test';
  if (isActive.value) return 'Activo';
  return 'Inactivo';
};

const getBadgeClass = () => {
  if (isTest.value) return 'badge-warning';
  if (isActive.value) return 'bg-gray-700 text-white';
  return 'badge-neutral';
};

const handleEdit = () => {
  const eventId = props.event?.id;
  if (eventId) {
    emit('edit', eventId);
  }
};
</script>