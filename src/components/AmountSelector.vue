<template>
  <div class="w-full">
    <p>Te invitamos a aportar voluntariamente lo que sientas que valió la experiencia. <span v-if="spectator?.numberOfPeople > 1">para cada integrante de tu grupo:</span></p>
    <div v-if="spectator?.numberOfPeople > 1" class="alert alert-info rounded-none my-6">
      <div class="flex">
        <InformationCircleIcon class="-ml-1 mr-3 h-5 min-w-5" aria-hidden="true" />
        <span class="text-xs text-left">Para dividir los aportes entre los integrantes de tu grupo.</span>
      </div>
      <a :href='`https://wa.me/?text=https://cuarenta-minutos.web.app/checkout/${spectator?.id || spectatorId}/${eventId}?referenceLink=true%26idVisitor=visitor-${randomId}`'>
        <button class="btn btn-sm min-w-56"><ShareIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Compartir link de pago</button></a>
    </div>
    <div class="flex flex-wrap justify-between items-center">
      <div v-if="spectator?.numberOfPeople > 1" class="form-control">
        <label class="label cursor-pointer flex justify-start gap-2">
          <input type="checkbox" class="checkbox checkbox-primary" :checked="uniquePaymentForGroup" @change="toggleUniquePayment" />
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
          v-model="localAmount[index]"
          @input="updateAmount"
          class="range range-primary bg-gray-200"
        />
      </div>
      <div class="mt-4 text-center text-xl font-semibold text-gray-800">
        {{ formatAmount(localAmount[index]) }}
      </div>
    </div>

    <div v-if="rowTableArray?.length > 1" class="overflow-x-auto mt-4">
      <table class="table">
        <thead>
          <tr>
            <th>Integrantes</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
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
            <td>{{uniquePaymentForGroup ? formatAmount(localAmount[0]) : formatAmount(localAmount[index]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="my-6 flex flex-wrap items-center gap-2">
      <p>Tu aporte total: {{ uniquePaymentForGroup && spectator ? formatAmount(localAmount[0] * spectator?.numberOfPeople) : formatAmount(totalAmount) }}</p>
      <button v-if="spectator?.numberOfPeople > 1 && isFirstGreaterThanZero" class="btn btn-link btn-sm text-gray-400" @click="setGroupValuesToZero">Prefiero aportar solamente lo mío</button>
    </div>
    
    <div v-if="Number(totalAmount) === 0" class="mt-4">
      <button class="btn btn-primary w-full text-white" @click="finalizeConcert">Finalizar concierto</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { InformationCircleIcon, ShareIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  spectator: {
    type: Object,
    default: null
  },
  amount: {
    type: Array,
    default: () => [12000]
  },
  uniquePaymentForGroup: {
    type: Boolean,
    default: true
  },
  eventId: {
    type: String,
    default: ''
  },
  spectatorId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:amount', 'update:uniquePaymentForGroup']);

// Variables reactivas
const localAmount = reactive([...props.amount]);
const spectatorArray = ref([1]);
const rowTableArray = ref([1]);
const randomId = ref('');

// Función para obtener un array de números del 1 al num
const getNumberArray = (num) => {
  return Array.from({ length: num }, (v, i) => i + 1);
};

// Establecer valores predeterminados para los espectadores
const setDefaultUniqueSpectator = (number) => {
  spectatorArray.value = getNumberArray(number);
  const items = spectatorArray.value;
  
  // Asegurar que localAmount tenga el tamaño correcto
  while (localAmount.length < items.length) {
    localAmount.push(props.uniquePaymentForGroup ? localAmount[0] : 0);
  }
  
  // Ajustar los valores existentes
  items.forEach((item, index) => {
    localAmount[index] = props.uniquePaymentForGroup ? localAmount[0] : localAmount[index] || 0;
  });
  
  // Redimensionar si es necesario
  if (localAmount.length > items.length) {
    localAmount.length = items.length;
  }
  
  // Emitir el cambio
  emit('update:amount', [...localAmount]);
};

// Actualizar cantidad de espectadores cuando cambie el prop
watch(() => props.spectator, (newSpectator) => {
  if (newSpectator && newSpectator.numberOfPeople) {
    setDefaultUniqueSpectator(props.uniquePaymentForGroup ? 1 : newSpectator.numberOfPeople);
    rowTableArray.value = getNumberArray(newSpectator.numberOfPeople);
  }
}, { immediate: true, deep: true });

// Verificar si el primer valor es mayor que cero y los demás son cero
const isFirstGreaterThanZero = computed(() => {
  if (localAmount.length > 1) {
    return localAmount[0] > 0 && !localAmount.slice(1).every(num => num === 0);
  } else {
    return true;
  }
});

// Calcular el monto total
const totalAmount = computed(() => 
  localAmount.reduce((total, num) => total + parseFloat(num), 0)
);

// Establecer todos los valores excepto el primero a cero
const setGroupValuesToZero = () => {
  emit('update:uniquePaymentForGroup', false);
  
  if (props.spectator && props.spectator.numberOfPeople) {
    setDefaultUniqueSpectator(props.spectator.numberOfPeople);
    
    // Establecer todos los valores excepto el primero a cero
    for (let i = 1; i < localAmount.length; i++) {
      localAmount[i] = 0;
    }
    
    // Emitir el cambio
    emit('update:amount', [...localAmount]);
  }
};

// Alternar entre pago único y pagos individuales
const toggleUniquePayment = () => {
  const newValue = !props.uniquePaymentForGroup;
  emit('update:uniquePaymentForGroup', newValue);
  
  if (props.spectator && props.spectator.numberOfPeople) {
    setDefaultUniqueSpectator(newValue ? 1 : props.spectator.numberOfPeople);
  }
};

// Actualizar los montos cuando cambie el input
const updateAmount = () => {
  if (props.uniquePaymentForGroup && localAmount.length > 1) {
    // Si es pago único, copiar el valor del primer elemento a todos
    const firstValue = localAmount[0];
    for (let i = 1; i < localAmount.length; i++) {
      localAmount[i] = firstValue;
    }
  }
  
  // Emitir los cambios
  emit('update:amount', [...localAmount]);
};

// Formatear el monto para mostrar
const formatAmount = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Generar un ID aleatorio para los enlaces compartidos
const generateRandomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  randomId.value = result;
};

// Función para finalizar el concierto y redirigir a la página de agradecimiento
const finalizeConcert = () => {
  router.push({
    name: 'ThankYou',
    query: { 
      idSpectator: props.spectator?.id || props.spectatorId,
      idEvent: props.eventId,
      paymentMethod: 'free',
      payment_id: 'null',
      amount: 0
    }
  });
};

// Inicializar
onMounted(() => {
  generateRandomId();
  
  // Configurar espectadores si ya hay datos disponibles
  if (props.spectator && props.spectator.numberOfPeople) {
    rowTableArray.value = getNumberArray(props.spectator.numberOfPeople);
    setDefaultUniqueSpectator(props.uniquePaymentForGroup ? 1 : props.spectator.numberOfPeople);
  }
});
</script>

<style scoped>
/* Estilos específicos si se necesitan */
</style>