<template>
  <div v-if="event && event.id" class="card bg-white shadow-xl">
    <div class="card-body">
      <!-- Header con estado y acciones -->
      <div class="flex justify-between items-start mb-3">
        <div class="flex gap-2">
          <div class="badge" :class="statusBadgeClass">
            {{ statusText }}
          </div>
          <div v-if="event.settings?.isTest" class="badge badge-warning">Test</div>
          <div v-if="event.settings?.isPrivate" class="badge badge-info">Privado</div>
        </div>
        <button @click="handleEdit" class="btn btn-ghost btn-xs">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <!-- Título del evento -->
      <div class="mb-2">
        <h2 class="card-title text-lg font-bold text-black">
          {{ displayName }}
        </h2>
        <p class="text-sm text-gray-600">{{ assemblyName }}</p>
      </div>

      <!-- Fecha -->
      <div class="mb-3">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ formattedDate }}
        </div>
      </div>

      <!-- Estadísticas del evento -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="stat bg-gray-50 rounded p-2">
          <div class="stat-title text-xs">Reservas</div>
          <div class="stat-value text-lg">{{ reservationCount }}</div>
        </div>
        <div class="stat bg-gray-50 rounded p-2">
          <div class="stat-title text-xs">Total Personas</div>
          <div class="stat-value text-lg">{{ totalPeople }}</div>
        </div>
      </div>

      <!-- Estado de operaciones -->
      <div class="flex flex-wrap gap-1 mb-3">
        <div class="badge badge-xs" :class="event.status?.isReservationOpen ? 'badge-success' : 'badge-neutral'">
          {{ event.status?.isReservationOpen ? 'Reservas: Abiertas' : 'Reservas: Cerradas' }}
        </div>
        <div class="badge badge-xs" :class="event.status?.isCheckinOpen ? 'badge-success' : 'badge-neutral'">
          {{ event.status?.isCheckinOpen ? 'Check-in: Abierto' : 'Check-in: Cerrado' }}
        </div>
        <div class="badge badge-xs" :class="event.status?.isFinished ? 'badge-error' : 'badge-neutral'">
          {{ event.status?.isFinished ? 'Finalizado' : 'En curso' }}
        </div>
      </div>

      <!-- Información adicional -->
      <div class="text-xs text-gray-500">
        <div v-if="event.settings?.invitationCode" class="mb-1">
          Código: {{ event.settings.invitationCode }}
        </div>
        <div v-if="hostName" class="mb-1">
          Anfitrión: {{ hostName }}
        </div>
        <div v-if="event.paymentMethodIds?.length" class="mb-1">
          Métodos de pago: {{ event.paymentMethodIds.length }}
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
    required: true
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

const displayName = computed(() => {
  return props.venueName || props.assemblyName || props.hostName || 'Sin nombre';
});

const statusText = computed(() => {
  if (!props.event) return 'Desconocido';
  if (props.event.settings?.isTest) return 'Test';
  if (props.event.settings?.isActive) return 'Activo';
  return 'Inactivo';
});

const statusBadgeClass = computed(() => {
  if (!props.event) return 'badge-neutral';
  if (props.event.settings?.isTest) return 'badge-warning';
  if (props.event.settings?.isActive) return 'badge-success';
  return 'badge-neutral';
});

const formattedDate = computed(() => {
  if (!props.event?.date || typeof props.event.date.toDate !== 'function') {
    return "Fecha no disponible";
  }
  return format(props.event.date.toDate(), "dd/MM/yyyy HH:mm", {
    locale: es,
  });
});

const reservationCount = computed(() => {
  return props.event?.zSpectator?.length || 0;
});

const totalPeople = computed(() => {
  if (!props.event?.zSpectator || !Array.isArray(props.event.zSpectator)) return 0;
  
  return props.event.zSpectator.reduce((total, spectator) => {
    return total + 1 + (spectator.numberOfCompanions || 0);
  }, 0);
});

const handleEdit = () => {
  if (props.event?.id) {
    emit('edit', props.event.id);
  }
};
</script>