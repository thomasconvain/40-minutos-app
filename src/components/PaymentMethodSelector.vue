<template>
  <div class="w-full">
    <div v-if="isLoading" class="flex justify-center my-6">
      <span class="loading loading-spinner loading-md"></span>
    </div>
    
    <div v-else-if="paymentMethods.length === 0" class="alert alert-warning my-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <span>No se encontraron métodos de pago disponibles para este evento.</span>
    </div>
    
    <div v-else class="flex flex-col gap-3">
      <!-- Tarjeta de crédito/débito (MercadoPago) -->
      <div v-if="hasPaymentType('Tarjeta')" class="card bg-base-100 border cursor-pointer transition-all" 
           :class="{'border-primary shadow-md': modelValue === 'card', 'border-base-300 hover:border-primary': modelValue !== 'card'}"
           @click="selectPaymentMethod('card')">
        <div class="card-body py-3 px-4">
          <h3 class="font-bold mb-0">Tarjeta de crédito/débito</h3>
          <p class="text-xs text-gray-600">Pago seguro procesado por MercadoPago</p>
        </div>
      </div>
      
      <!-- Transferencia bancaria -->
      <div v-if="hasPaymentType('Transferencia electrónica')" class="card bg-base-100 border cursor-pointer transition-all" 
           :class="{'border-primary shadow-md': modelValue === 'transfer', 'border-base-300 hover:border-primary': modelValue !== 'transfer'}"
           @click="selectPaymentMethod('transfer')">
        <div class="card-body py-3 px-4">
          <h3 class="font-bold mb-0">Transferencia bancaria</h3>
          <p class="text-xs text-gray-600">Te mostraremos los datos de la cuenta para transferir</p>
        </div>
      </div>
      
      <!-- Pago en efectivo -->
      <div v-if="hasPaymentType('Efectivo')" class="card bg-base-100 border cursor-pointer transition-all" 
           :class="{'border-primary shadow-md': modelValue === 'cash', 'border-base-300 hover:border-primary': modelValue !== 'cash'}"
           @click="selectPaymentMethod('cash')">
        <div class="card-body py-3 px-4">
          <h3 class="font-bold mb-0">Pago en efectivo</h3>
          <p class="text-xs text-gray-600">Paga en puntos autorizados</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  eventId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const isLoading = ref(true);
const paymentMethods = ref([]);
const event = ref(null);

// Cargar los métodos de pago desde el evento
const fetchPaymentMethods = async () => {
  isLoading.value = true;
  paymentMethods.value = [];
  
  try {
    // Obtener el documento del evento
    const eventDoc = await getDoc(doc(db, 'events', props.eventId));
    
    if (eventDoc.exists()) {
      event.value = eventDoc.data();
      
      // Verificar si el evento tiene métodos de pago configurados
      if (event.value.settings?.paymentMethodIds && event.value.settings.paymentMethodIds.length > 0) {
        // Cargar los detalles de cada método de pago
        const methodPromises = event.value.settings.paymentMethodIds.map(methodId => 
          getDoc(doc(db, 'payment-methods', methodId))
        );
        
        const methodDocs = await Promise.all(methodPromises);
        
        // Filtrar y mapear solo los documentos que existen
        paymentMethods.value = methodDocs
          .filter(doc => doc.exists())
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        console.log('Métodos de pago cargados:', paymentMethods.value);
        
        // Si no hay un método seleccionado pero hay métodos disponibles, seleccionar el primero
        if (!props.modelValue && paymentMethods.value.length > 0) {
          // Preferir tarjeta primero, luego transferencia, luego efectivo
          if (hasPaymentType('Tarjeta')) {
            selectPaymentMethod('card');
          } else if (hasPaymentType('Transferencia electrónica')) {
            selectPaymentMethod('transfer');
          } else if (hasPaymentType('Efectivo')) {
            selectPaymentMethod('cash');
          }
        }
      } else {
        console.warn('El evento no tiene métodos de pago configurados');
      }
    } else {
      console.error('No se encontró el evento con ID:', props.eventId);
    }
  } catch (error) {
    console.error('Error al cargar los métodos de pago:', error);
  } finally {
    isLoading.value = false;
  }
};

// Comprobar si existe un método de pago de un tipo específico
const hasPaymentType = (paymentType) => {
  return paymentMethods.value.some(method => method.paymentType === paymentType);
};


// Seleccionar un método de pago
const selectPaymentMethod = (method) => {
  emit('update:modelValue', method);
};

// Cargar los métodos de pago al montar el componente
onMounted(() => {
  if (props.eventId) {
    fetchPaymentMethods();
  } else {
    isLoading.value = false;
    console.error('No se proporcionó un ID de evento');
  }
});
</script>

<style scoped>
/* Estilos para la selección */
.card {
  position: relative;
}
</style>