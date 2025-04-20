<template>
  <div class="card w-full bg-base-100 border border-base-600 relative h-auto">
    <!-- Indicador de estado "Pronto" (arriba a la derecha) -->
    <span
      v-if="!event.isCheckinActive"
      class="absolute top-2 right-2 badge badge-primary z-10"
    >Pronto</span>
    
    <div class="card-body p-4 flex flex-col gap-1">
      <!-- Primera sección: Título y subtítulo -->
      <div>
        <h2 class="card-title text-xl md:text-2xl font-bold mb-1">{{ event.place }}</h2>
        <p class="text-sm md:text-base mb-1">{{ event.name }}</p>
      </div>
      
      <!-- Segunda sección: Fecha -->
      <div>
        <span class="inline-block px-3 py-1 text-xs md:text-sm rounded-full" 
          :class="{'border border-gray-300 bg-gray-50 text-gray-600': !$attrs.class?.includes('bg-black'), 
                  'border border-gray-700 bg-black text-gray-300': $attrs.class?.includes('bg-black')}">
          {{ formatDate(event.date) }}
        </span>
      </div>
      
      <!-- Tercera sección: Información adicional (condicional) -->
      <div v-if="(isLoggedIn && numberOfCompanions !== undefined) || event.hostName || showCheckinMessage" class="mt-1">
        <!-- Número de acompañantes (solo si está logeado) -->
        <p v-if="isLoggedIn && numberOfCompanions !== undefined" class="mb-1">
          Te acompañan {{ numberOfCompanions }} personas
        </p>
        
        <!-- Info de anfitrión si existe -->
        <p v-if="event.hostName" class="mb-1">
          <strong>Anfitrión:</strong> {{ event.hostName }}
        </p>
        
        <!-- Mensaje condicional para checkin -->
        <div
          v-if="showCheckinMessage"
          :class="{
            'alert alert-info rounded-none flex text-left mt-2': !customMessageClass && !event.isCheckinActive,
            'alert alert-success rounded-none flex text-left mt-2': !customMessageClass && event.isCheckinActive && $attrs.class?.includes('bg-black'),
            'p-3 rounded-none flex text-left mt-2 bg-amber-500/20 border-l-4 border-amber-500': customMessageClass
          }"
        >
          <span :class="{'text-xs': !customMessageClass, 'text-sm text-white': customMessageClass}">
            <template v-if="customMessageClass">
              Checkin abierto, debes <router-link to="/login" class="underline font-medium">entrar</router-link> con tu usuario y contraseña
            </template>
            <template v-else>
              {{ checkinMessageText }}
            </template>
          </span>
        </div>
      </div>
      
      <!-- Cuarta sección: Botones (separados del resto) -->
      <div class="card-actions justify-start mt-auto pt-2">
        <!-- Botón quiero asistir / hacer checkin -->
        <button
          v-if="showActionButton"
          :class="[
            'btn btn-sm md:btn-md border-transparent',
            buttonStyle === 'white' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
          ]"
          @click="handleAction"
        >
          {{ actionButtonText }}
        </button>
        
        <!-- Botón para compartir vía WhatsApp -->
        <div class="w-full" v-if="showShareButton">
          <a :href="whatsappShareLink">
            <button class="btn btn-active mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="-ml-1 mr-3 h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Z" />
              </svg>
              Compartir evento
            </button>
          </a>
        </div>
      </div>
      
      <!-- Logo (posicionado en esquina superior derecha) -->
      <img 
        v-if="showLogo" 
        :src="logoUrl" 
        class="absolute top-4 right-4 w-16 opacity-70" 
        alt="Event logo" 
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  numberOfCompanions: {
    type: Number,
    default: undefined
  },
  showCheckinMessage: {
    type: Boolean,
    default: true
  },
  checkinMessageText: {
    type: String,
    default: "El día del concierto se habilitará el acceso a tu checkin."
  },
  showActionButton: {
    type: Boolean,
    default: true
  },
  actionButtonText: {
    type: String,
    default: "Quiero asistir"
  },
  buttonStyle: {
    type: String,
    default: "white"
  },
  showShareButton: {
    type: Boolean,
    default: true
  },
  spectatorId: {
    type: String,
    default: ""
  },
  showLogo: {
    type: Boolean,
    default: false
  },
  logoUrl: {
    type: String,
    default: () => require("@/assets/logo.png")
  },
  customMessageClass: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['action']);

// Formatear fecha para mostrar
const formatDate = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return "Fecha no disponible";
  }
  
  const date = format(timestamp.toDate(), "EEEE dd 'de' MMMM", {
    locale: es,
  });
  
  const time = format(timestamp.toDate(), "HH.mm 'hrs'", {
    locale: es,
  });
  
  return date + " • " + time;
};

// Link para compartir por WhatsApp
const whatsappShareLink = computed(() => {
  const baseUrl = "https://wa.me/?text=";
  const eventUrl = `https://cuarenta-minutos.web.app/sign-in/${props.event.id}/?referenceLink=true%26hostId=${props.spectatorId}`;
  return `${baseUrl}${encodeURIComponent(eventUrl)}`;
});

// Manejar acción del botón
const handleAction = () => {
  emit('action', props.event);
};
</script>

<style scoped>
.card {
  position: relative;
  overflow: hidden;
}

/* Ajuste para tamaño mínimo de tarjeta */
.card-body {
  min-height: 200px;
}

/* Estilos para adaptar el componente en contextos de fondo oscuro */
:deep(.bg-black) {
  color: white;
}

:deep(.bg-black) p {
  color: #d1d5db; /* text-gray-300 */
}

/* Estilo para el tag de fecha en modo oscuro */
:deep(.bg-black) .rounded-full {
  background-color: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.15);
  color: #d1d5db;
}

/* Estilo para la imagen del logo */
.card img.absolute {
  z-index: 1;
  transition: opacity 0.3s ease;
}

.card:hover img.absolute {
  opacity: 1;
}
</style>