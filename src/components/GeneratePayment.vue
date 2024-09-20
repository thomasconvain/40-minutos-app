<template>
  <div class="w-full">
  <div v-if="isViewLoading" class="flex justify-center w-full">
    <span class="loading loading-spinner loading-md"></span>
  </div>
  <div v-else>
  <p>Selecciona el monto que quieres aportar <span v-if="spectator?.number_of_people > 1">para cada integrante de tu grupo:</span></p>
  <div v-if="spectator?.number_of_people > 1" class="alert alert-info rounded-none my-6">
      <InformationCircleIcon class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
      <span class="text-xs">Tambien puedes compartir el link de pago a algunos integrantes de tu grupo para que puedan realizar su propio aporte.</span>
      <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/checkout/${params}?referenceLink=true`'><button class="btn btn-sm">Compartir link de pago</button></a>
    </div>
    <div v-if="rowTableArray?.length > 1" class="form-control">
      <label class="label cursor-pointer flex justify-start gap-2">
        <input type="checkbox" class="checkbox checkbox-primary" :checked="uniquePaymentOfGroup" @change="uniquePaymentOfGroup ? (setDefaultUniqueSpectator(spectator.number_of_people), uniquePaymentOfGroup = false) : (setDefaultUniqueSpectator(1), uniquePaymentOfGroup = true)" />
        <span class="label-text">Quiero aportar el mismo monto para todos los integrantes:</span>
      </label>
    </div>
  <div v-for="(item, index) in spectatorArray" :key="index" class="mt-4">
      <label for="amount" class="block text-lg font-medium text-gray-700 mb-2">
        <div v-if="spectatorArray.length > 1" class="flex items-center gap-2">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content w-8 rounded-full">
              <span>I</span>
            </div>
          </div>
          <p class="text-xs">Integrante {{ item }}</p>
        </div>
      </label>
      <div class="relative flex">
        <input
          type="range"
          id="amount"
          min="0"
          max="100000"
          step="500"
          v-model="amount[index]"
          @input="updateProgress"
          class="range range-primary bg-gray-200"
        />
      </div>
      <div class="mt-4 text-center text-xl font-semibold text-gray-800">
        {{ formatAmount(amount[index]) }}
      </div>
    </div>

    <div v-if="rowTableArray?.length > 1" class="overflow-x-auto mt-4">
      <table class="table">
        <!-- head -->
        <thead>
          <tr>
            <th>Integrantes</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          <!-- row 1 -->
          <tr v-for="(row, index) in rowTableArray" :key="index">
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar placeholder">
                  <div class="bg-neutral text-neutral-content w-8 rounded-full">
                    <span>I</span>
                  </div>
                </div>
                <div>
                  <div class="font-bold">Integrante {{ row }}</div>
                </div>
              </div>
            </td>
            <td>{{uniquePaymentOfGroup ? formatAmount(amount[0]) : formatAmount(amount[index]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="my-6">Tu aporte total: {{ uniquePaymentOfGroup && spectator ? formatAmount(amount[0] * spectator?.number_of_people) : formatAmount(totalAmountToPay) }}</p>

    <div class="mt-6">
      <label for="email" class="block text-sm font-medium text-gray-700">Tu correo</label>
      <div class="mt-1">
        <input
          v-model="email"
          type="email"
          name="email"
          id="email"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="correo@ejemplo.com"
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
  </div>{{ totalAmountToPay }}
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { createPaymentLink } from '@/services/mercadoPago';
import { CreditCardIcon } from '@heroicons/vue/24/outline'
import { useRouter, useRoute } from 'vue-router';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { InformationCircleIcon } from '@heroicons/vue/24/outline'


const router = useRouter();
const route = useRoute();

// Variables reactivas
const isLoading = ref(false);
const spectator = ref(null);
const amount = reactive([5000]);
const description = ref('Tu experiencia 40 Minutos');
const email = ref('');
const progressWidth = ref('50%');
const paymentLink = ref('');
const emailError = ref('');
const baseUrl = ref('');
const params = ref('');
const spectatorArray = ref();
const rowTableArray = ref();
const uniquePaymentOfGroup = ref(true);
const isViewLoading = ref(false);

onMounted(() => {
  // Captura los parámetros actuales de la URL
  baseUrl.value = window.location.origin; // Obtiene la URL base actual (dominio)
  params.value = route.params.idSpectator;
  if (params.value && !route.query.referenceLink) {
  fetchSpectator();
  } else {
    setDefaultUniqueSpectator(1)
  }
  updateProgress();
});
const setDefaultUniqueSpectator = (number) => {
  spectatorArray.value = getNumberArray(number);
  const items = spectatorArray.value;
  items.forEach((item, index) => {
    amount[index] = uniquePaymentOfGroup.value == true ?  amount[0] : (amount.length = 1, amount[0]); // Inicializamos el valor de cada input
  });
}
// Función para obtener los datos del espectador desde Firestore
const fetchSpectator = async () => {
  isViewLoading.value = true;
  const db = getFirestore();
  const docRef = doc(db, 'spectators', params.value);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
      email.value = spectator.value.email;
      spectatorArray.value = getNumberArray(1);
      rowTableArray.value = getNumberArray(spectator.value.number_of_people);
      const items = spectatorArray.value;
      items.forEach((item, index) => {
        amount[index] = 5000; // Inicializamos el valor de cada input
      });
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos del espectador:', error);
  }
  isViewLoading.value = false;
};

const getNumberArray = (num) => {
      return Array.from({ length: num }, (v, i) => i + 1);
};

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
      amount: totalAmountToPay.value,
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
const formatAmount = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0, // Controla los dígitos decimales
  }).format(amount);
};

const totalAmountToPay = computed(() =>
  amount.reduce((total, num) => total + parseFloat(num), 0)
)

const goToThankYouPage = () => {
  router.push({
    name: 'ThankYou',
    query: { idSpectator: route.params.idSpectator}
  });
};
</script>

<style>
.fix-focus-toggle {
  opacity: 0.6;
}
.fix-focus-toggle:focus {
  box-shadow: var(--handleoffsetcalculator) 0 0 2px var(--tglbg) inset,
    0 0 0 2px var(--tglbg) inset,
    var(--togglehandleborder)
}
.fix-focus-toggle:checked {
  opacity: 1;
}
</style>
