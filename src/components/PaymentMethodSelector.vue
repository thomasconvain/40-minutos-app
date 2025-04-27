<template>
  <div class="w-full">
    <p class="mb-4">Selecciona cómo quieres realizar tu aporte de {{ formatAmount(amount) }}</p>
    <div class="flex flex-col gap-3">
      <div class="card bg-base-100 border cursor-pointer transition-all" 
           :class="{'border-primary shadow-md': modelValue === 'card', 'border-base-300 hover:border-primary': modelValue !== 'card'}"
           @click="$emit('update:modelValue', 'card')">
        <div class="card-body py-3 px-4">
          <h3 class="font-bold mb-0">Tarjeta de crédito/débito</h3>
          <p class="text-xs text-gray-600">Pago seguro procesado por MercadoPago</p>
        </div>
      </div>
      
      <div class="card bg-base-100 border cursor-pointer transition-all" 
           :class="{'border-primary shadow-md': modelValue === 'transfer', 'border-base-300 hover:border-primary': modelValue !== 'transfer'}"
           @click="$emit('update:modelValue', 'transfer')">
        <div class="card-body py-3 px-4">
          <h3 class="font-bold mb-0">Transferencia bancaria</h3>
          <p class="text-xs text-gray-600">Te mostraremos los datos de la cuenta para transferir</p>
        </div>
      </div>
      
      <div class="card bg-base-100 border cursor-pointer transition-all" 
           :class="{'border-primary shadow-md': modelValue === 'cash', 'border-base-300 hover:border-primary': modelValue !== 'cash'}"
           @click="$emit('update:modelValue', 'cash')">
        <div class="card-body py-3 px-4">
          <h3 class="font-bold mb-0">Pago en efectivo</h3>
          <p class="text-xs text-gray-600">Paga en puntos autorizados</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  }
});

// Formatear el monto para mostrar
const formatAmount = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};
</script>

<style scoped>
/* Estilos para la selección */
.card {
  position: relative;
}
</style>