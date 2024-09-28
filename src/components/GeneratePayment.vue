<template>
  <div class="w-full">
  <div v-if="isViewLoading" class="flex justify-center w-full">
    <span class="loading loading-spinner loading-md"></span>
  </div>
  <div v-else>
  <p>Selecciona el monto que quieres aportar <span v-if="spectator?.numberOfPeople > 1">para cada integrante de tu grupo:</span></p>
  <div v-if="spectator?.numberOfPeople > 1" class="alert alert-info rounded-none my-6">
      <div class="flex">
        <InformationCircleIcon class="-ml-1 mr-3 h-5 min-w-5" aria-hidden="true" />
        <span class="text-xs text-left">Tambien puedes compartir el link de pago a algunos integrantes de tu grupo para que puedan realizar su propio aporte.</span>
      </div>
      <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/checkout/${spectatorParams}/${eventParams}?referenceLink=true%26idVisitor=visitor-${randomId}`'>
        <button class="btn btn-sm min-w-56"><ShareIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Compartir link de pago</button></a>
    </div>
    <div class="flex flex-wrap justify-between items-center">
      <div v-if="rowTableArray?.length > 1" class="form-control">
        <label class="label cursor-pointer flex justify-start gap-2">
          <input type="checkbox" class="checkbox checkbox-primary" :checked="uniquePaymentForGroup" @change="uniquePaymentForGroup ? (setDefaultUniqueSpectator(spectator.numberOfPeople), uniquePaymentForGroup = false) : (setDefaultUniqueSpectator(1), uniquePaymentForGroup = true)" />
          <span class="label-text">Quiero aportar el mismo monto para todos los integrantes:</span>
        </label>
      </div>
    </div>
    <div v-for="(item, index) in spectatorArray" :key="index" class="mt-4">
      <label for="amount" class="block text-lg font-medium text-gray-700 mb-2">
        <div v-if="spectatorArray.length > 1" class="flex items-center gap-2">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content w-8 rounded-full">
              <span>I</span>
            </div>
          </div>
          <p v-if="item === 1" class="text-xs">Tu aporte</p>
          <p v-else class="text-xs">Integrante {{ item - 1 }}</p>
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
                  <div v-if="row === 1" class="font-bold">Tu aporte</div>
                  <div v-else class="font-bold">Integrante {{ row - 1 }}</div>
                </div>
              </div>
            </td>
            <td>{{uniquePaymentForGroup ? formatAmount(amount[0]) : formatAmount(amount[index]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-6 flex flex-wrap items-center gap-2">
      <p>Tu aporte total: {{ uniquePaymentForGroup && spectator ? formatAmount(amount[0] * spectator?.numberOfPeople) : formatAmount(totalAmountToPay) }}</p>
      <button v-if="spectator?.numberOfPeople > 1 && isFirstGreaterThanZero" class="btn btn-link btn-sm text-gray-400" @click="setGroupValuesToZero">Prefiero aportar solamente lo mío</button>
    </div>
    <div class="mt-6">
      <label for="email" class="block text-sm font-medium text-gray-700">Tu correo</label>
      <div class="mt-1">
        <input
          v-model="email"
          type="email"
          name="email"
          id="email"
          class="shadow-sm focus:ring-gray-500 focus:border-gray-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="correo@ejemplo.com"
        />
      </div>
      <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
    </div>

    <button
      type="button"
      :disabled="isButtonDisabled"
      class="btn-md btn btn-primary text-white w-full mt-2"
      @click="generatePaymentLink"
    >
      <CreditCardIcon v-if="!isLoading" class="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
      <span v-if="!isLoading">Pagar con Mercado Pago</span>
      <span v-if="isLoading">Te estamos redirigiendo...</span>
    </button>
    <button class="btn btn-active mt-2 w-full text-gray-400" @click="goToThankYouPage">Prefiero pagar por transferencia</button>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { createPaymentLink } from '@/services/mercadoPago';
import { CreditCardIcon } from '@heroicons/vue/24/outline'
import { useRouter, useRoute } from 'vue-router';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { InformationCircleIcon, ShareIcon } from '@heroicons/vue/24/outline'


const router = useRouter();
const route = useRoute();

// Variables reactivas
const isLoading = ref(false);
const spectator = ref(null);
const amount = reactive([12000]);
const description = ref('Tu experiencia 40 Minutos');
const email = ref('');
const progressWidth = ref('50%');
const paymentLink = ref('');
const emailError = ref('');
const baseUrl = ref('');
const spectatorParams = ref('');
const eventParams = ref('');
const spectatorArray = ref();
const rowTableArray = ref();
const uniquePaymentForGroup = ref(true);
const isViewLoading = ref(false);
const randomId = ref('');

onMounted(async () => {
  // Captura los parámetros actuales de la URL
  baseUrl.value = window.location.origin; // Obtiene la URL base actual (dominio)
  spectatorParams.value = route.params.idSpectator;
  eventParams.value = route.params.idEvent;
  if (spectatorParams.value && !route.query.referenceLink) {
    await fetchSpectator();
    if (!spectator.value.uniquePaymentForGroup) {
      setGroupValuesToZero()
    }
  } else {
    setDefaultUniqueSpectator(1)
  }
  generateRandomId();
  updateProgress();
});
const setDefaultUniqueSpectator = (number) => {
  spectatorArray.value = getNumberArray(number);
  const items = spectatorArray.value;
  items.forEach((item, index) => {
    amount[index] = uniquePaymentForGroup.value == true ?  amount[0] : (amount.length = 1, amount[0]); // Inicializamos el valor de cada input
  });
}
// Función para obtener los datos del espectador desde Firestore
const fetchSpectator = async () => {
  isViewLoading.value = true;
  const db = getFirestore();
  const docRef = doc(db, 'spectators', spectatorParams.value);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      spectator.value = docSnap.data();
      email.value = spectator.value.email;
      spectatorArray.value = getNumberArray(1);
      rowTableArray.value = getNumberArray(spectator.value.numberOfPeople);
      const items = spectatorArray.value;
      items.forEach((item, index) => {
        amount[index] = 12000; // Inicializamos el valor de cada input
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

const setGroupValuesToZero = () => {
  uniquePaymentForGroup.value = false;
  setDefaultUniqueSpectator(spectator.value.numberOfPeople)
  amount.fill(0, 1);
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
      amount: (uniquePaymentForGroup.value && spectator && !route.query.referenceLink) ? amount[0] * spectator.value.numberOfPeople : totalAmountToPay.value,
      description: description.value,
      email: email.value,
      backUrls: {
        success: `${baseUrl.value}/thankyou?idSpectator=${spectatorParams.value}`,
        failure: `${baseUrl.value}/thankyou?idSpectator=${spectatorParams.value}`,
        pending: `${baseUrl.value}/thankyou?idSpectator=${spectatorParams.value}`,
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

// Computed para evaluar si el primer índice es mayor que 0 y todos los demás son iguales a 0
const isFirstGreaterThanZero = computed(() => {
  if (amount.length > 1) {
  return amount[0] > 0 && !amount.slice(1).every(num => num === 0);
  } else {
    return true
  }
});

// Definir la función para generar el ID aleatorio
function generateRandomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  randomId.value = result;
}

const goToThankYouPage = () => {
  router.push({
    name: 'ThankYou',
    query: { 
      idSpectator: route.params.idSpectator,
      idVisitor: route.query.idVisitor,
      idEvent: route.params.idEvent,
      paymentMethod: 'bankTransfer',
      amount: (uniquePaymentForGroup.value && spectator && !route.query.referenceLink) ? amount[0] * spectator.value.numberOfPeople : totalAmountToPay.value }
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
