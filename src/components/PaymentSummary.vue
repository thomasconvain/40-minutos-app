<template>
  <div class="w-full">
    <div v-if="isLoading" class="flex justify-center my-6">
      <span class="loading loading-spinner loading-md"></span>
    </div>
    
    <div v-else class="space-y-4">
      <!-- Resumen del pago -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="font-bold">Detalles del aporte</h3>
          <div class="flex justify-between mt-2">
            <span>Monto:</span>
            <span>{{ formatAmount(amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Método:</span>
            <span>{{ getPaymentMethodName() }}</span>
          </div>
                    
          <!-- Mostrar las instrucciones personalizadas del método de pago -->
          <div v-if="selectedPaymentMethodData?.instructions" class="mt-4 alert alert-info text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{{ selectedPaymentMethodData.instructions }}</span>
          </div>
        </div>
      </div>
      
      <!-- Mostrar detalles de transferencia bancaria si es el método seleccionado -->
      <div v-if="paymentMethod === 'transfer'">
        <BankTransferDetails :eventId="eventId" ref="bankTransferDetailsRef" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import BankTransferDetails from '@/components/BankTransferDetails.vue';

const props = defineProps({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  eventId: {
    type: String,
    required: true
  }
});

const isLoading = ref(true);
const bankTransferDetailsRef = ref(null);
const paymentMethods = ref([]);
const event = ref(null);

// Obtener el nombre del método de pago en formato legible
const getPaymentMethodName = () => {
  switch (props.paymentMethod) {
    case 'card': return 'Tarjeta';
    case 'transfer': return 'Transferencia';
    case 'cash': return 'Efectivo';
    default: return 'Desconocido';
  }
};

// Obtener los datos del método de pago seleccionado
const selectedPaymentMethodData = computed(() => {
  let paymentType;
  
  switch (props.paymentMethod) {
    case 'card': paymentType = 'Tarjeta'; break;
    case 'transfer': paymentType = 'Transferencia electrónica'; break;
    case 'cash': paymentType = 'Efectivo'; break;
    default: return null;
  }
  
  return paymentMethods.value.find(method => method.paymentType === paymentType);
});

// Formatear el monto para mostrar
const formatAmount = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Cargar los métodos de pago desde el evento
const fetchPaymentMethods = async () => {
  isLoading.value = true;
  
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
        
        console.log('Métodos de pago cargados en resumen:', paymentMethods.value);
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

// Exponer el componente BankTransferDetails para que el componente padre pueda acceder a él
defineExpose({
  bankTransferDetailsRef
});

// Cargar datos al montar el componente
onMounted(async () => {
  await fetchPaymentMethods();
  
  // Cargar los detalles de la transferencia bancaria si es el método seleccionado
  if (props.paymentMethod === 'transfer' && bankTransferDetailsRef.value) {
    bankTransferDetailsRef.value.fetchBankAccount();
  }
});
</script>

<style scoped>
/* Estilos específicos si se necesitan */
</style>