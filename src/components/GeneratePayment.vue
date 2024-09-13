<template>
  <div class="w-full">
    <div>
      <label for="amount" class="block text-lg font-medium text-gray-700 mb-2">
        Selecciona el monto que quieras aportar:
      </label>
      <div class="relative flex">
        <input
          type="range"
          id="amount"
          min="0"
          max="100000"
          step="500"
          v-model="amount"
          @input="updateProgress"
          class="range range-primary bg-gray-200"
        />
      </div>
      <div class="mt-4 text-center text-xl font-semibold text-gray-800">
        {{ formattedAmount }}
      </div>
    </div>

    <div class="mb-6">
      <label for="email" class="block text-sm font-medium text-gray-700">Tu correo</label>
      <div class="mt-1">
        <input
          v-model="email"
          type="email"
          name="email"
          id="email"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="you@example.com"
        />
      </div>
      <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
    </div>

    <button
      type="button"
      :disabled="isButtonDisabled"
      class="mt-2 inline-flex justify-center w-full items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="generatePaymentLink"
    >
      <CreditCardIcon v-if="!isLoading" class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
      <span v-if="!isLoading">Pagar</span>
      <span v-if="isLoading">Te estamos redirigiendo...</span>
    </button>
    <button class="btn btn-active btn-link w-full text-gray-400" @click="goToThankYouPage">Prefiero no aportar</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { createPaymentLink } from '@/services/mercadoPago';
import { CreditCardIcon } from '@heroicons/vue/24/outline'
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();

// Variables reactivas
const isLoading = ref(false);
const amount = ref(2000);
const description = ref('Tu experiencia 40 Minutos');
const email = ref('');
const progressWidth = ref('50%');
const paymentLink = ref('');
const emailError = ref('');
const baseUrl = ref('');
const params = ref('');
const route = useRoute();

onMounted(() => {
  updateProgress();
      // Captura los parámetros actuales de la URL
    baseUrl.value = window.location.origin; // Obtiene la URL base actual (dominio)
    params.value = route.params.idSpectator;
});

const updateProgress = () => {
  const percentage = (amount.value / 100000) * 100;
  progressWidth.value = `${percentage}%`;
};

// Validación del email
const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value)) {
    emailError.value = 'Por favor ingresa un correo válido.';
  } else {
    emailError.value = '';
  }
};

// Método para generar el link de pago
const generatePaymentLink = async () => {
  validateEmail();
  if (emailError.value === '') {
  isLoading.value = true;
  try {
    paymentLink.value = await createPaymentLink({
      amount: amount.value,
      description: description.value,
      email: email.value,
      backUrls: {
        success: `${baseUrl.value}/thankyou?idSpectator=${params.value}`,
        failure: `${baseUrl.value}/thankyou?idSpectator=${params.value}`,
        pending: `${baseUrl.value}/thankyou?idSpectator=${params.value}`,
      },
    });
    window.open(paymentLink.value, '_self');
  } catch (error) {
    alert('Hubo un problema al generar el link de pago.');
  }
}
  isLoading.value = false;
};
const formattedAmount = computed(() => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount.value);
});

const goToThankYouPage = () => {
  router.push({
    name: 'ThankYou',
  });
};
</script>

<style>

</style>
