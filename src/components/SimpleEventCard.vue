<template>
  <div class="card bg-white shadow-xl">
    <div class="card-body">
      <!-- Header con estado y acciones -->
      <div class="flex justify-between items-start mb-3">
        <div class="flex gap-2">
          <div class="badge" :class="getBadgeClass()">
            {{ getStatusText() }}
          </div>
          <div v-if="isTest" class="badge badge-warning">Test</div>
          <div v-if="isPrivate" class="badge badge-info">Privado</div>
        </div>
        <button @click="handleEdit" class="btn btn-ghost btn-xs" title="Editar evento">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <!-- Título del evento -->
      <div class="mb-2">
        <h2 class="card-title text-lg font-bold text-black">{{ eventTitle }}</h2>
        <p class="text-sm text-gray-600">{{ assemblyName || 'Sin ensamble' }}</p>
      </div>

      <!-- Fecha -->
      <div class="mb-3">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ eventDate }}
        </div>
      </div>

      <!-- Estadísticas del evento -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="stat bg-gray-50 rounded p-2">
          <div class="stat-title text-xs">Reservas</div>
          <div class="stat-value text-lg">{{ reservations }}</div>
        </div>
        <div class="stat bg-gray-50 rounded p-2">
          <div class="stat-title text-xs">Total Personas</div>
          <div class="stat-value text-lg">{{ totalPeople }}</div>
        </div>
      </div>

      <!-- Estado de operaciones -->
      <div class="flex flex-wrap gap-1 mb-3">
        <div class="badge badge-xs" :class="reservationsOpen ? 'badge-success' : 'badge-neutral'">
          {{ reservationsOpen ? 'Reservas: Abiertas' : 'Reservas: Cerradas' }}
        </div>
        <div class="badge badge-xs" :class="checkinOpen ? 'badge-success' : 'badge-neutral'">
          {{ checkinOpen ? 'Check-in: Abierto' : 'Check-in: Cerrado' }}
        </div>
        <div class="badge badge-xs" :class="finished ? 'badge-error' : 'badge-neutral'">
          {{ finished ? 'Finalizado' : 'En curso' }}
        </div>
      </div>

      <!-- Información adicional -->
      <div class="text-xs text-gray-500">
        <div v-if="invitationCode" class="mb-1">
          Código: {{ invitationCode }}
        </div>
        <div v-if="hostName" class="mb-1">
          Anfitrión: {{ hostName }}
        </div>
        <div v-if="paymentMethods > 0" class="mb-1">
          Métodos de pago: {{ paymentMethods }}
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

const reservations = computed(() => {
  try {
    return props.event?.zSpectator?.length || 0;
  } catch {
    return 0;
  }
});

const totalPeople = computed(() => {
  try {
    if (!props.event?.zSpectator || !Array.isArray(props.event.zSpectator)) return 0;
    return props.event.zSpectator.reduce((total, spectator) => {
      return total + 1 + (spectator?.numberOfCompanions || 0);
    }, 0);
  } catch {
    return 0;
  }
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
  if (isActive.value) return 'badge-success';
  return 'badge-neutral';
};

const handleEdit = () => {
  const eventId = props.event?.id;
  if (eventId) {
    emit('edit', eventId);
  }
};
</script>