<template>
  <div class="w-full">   
    <div class="card bg-base-100 border border-base-300 mb-4">
      <div class="card-body">
        <h3 class="font-bold">Detalles del aporte</h3>
        <div class="flex justify-between mt-2">
          <span>Monto:</span>
          <span>{{ formatAmount(amount) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Método:</span>
          <span>{{ paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia' }}</span>
        </div>        
        <div v-if="paymentMethod === 'card'" class="mt-4 alert alert-info text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>Al confirmar, serás redirigido a la plataforma segura de MercadoPago para completar la transacción.</span>
        </div>
      </div>
    </div>
    
    <!-- Mostrar detalles de transferencia bancaria si es el método seleccionado -->
    <div v-if="paymentMethod === 'transfer'">
      <BankTransferDetails :eventId="eventId" ref="bankTransferDetailsRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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

const bankTransferDetailsRef = ref(null);

// Formatear el monto para mostrar
const formatAmount = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Exponer el componente BankTransferDetails para que el componente padre pueda acceder a él
defineExpose({
  bankTransferDetailsRef
});

// Cargar los detalles de la transferencia bancaria si es el método seleccionado
onMounted(() => {
  if (props.paymentMethod === 'transfer' && bankTransferDetailsRef.value) {
    bankTransferDetailsRef.value.fetchBankAccount();
  }
});
</script>

<style scoped>
/* Estilos específicos si se necesitan */
</style>