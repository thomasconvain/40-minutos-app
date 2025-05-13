<template>
  <div class="container mx-auto max-w-md p-4">
    <div class="flex flex-col items-center gap-6">
      <img src="../assets/logo_horizontal.png" width="150">
      
      <!-- Pasos -->
      <div class="w-full">
        <ul class="steps w-full">
          <li class="step" :class="activeStep >= 1 ? 'step-primary' : ''">Aporte</li>
          <li class="step" :class="activeStep >= 2 ? 'step-primary' : ''">Medio</li>
          <li class="step" :class="activeStep >= 3 ? 'step-primary' : ''">Pago</li>
        </ul>
      </div>
      
      <!-- Cargando -->
      <div v-if="isLoading" class="flex justify-center w-full my-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>
      
      <!-- Paso 1: Aporte -->
      <div v-else-if="activeStep === 1" class="w-full">
        <div class="mt-4 w-full">
          
          <!-- Componente selector de monto -->
          <AmountSelector 
            :spectator="spectator"
            :spectatorId="spectatorParams"
            :amount="amount"
            :uniquePaymentForGroup="uniquePaymentForGroup" 
            :eventId="eventParams"
            @update:amount="updateAmount"
            @update:uniquePaymentForGroup="updateUniquePaymentForGroup"
          />
        </div>
      </div>
      
      <!-- Paso 2: Método de pago -->
      <div v-else-if="activeStep === 2" class="w-full">
        <PaymentMethodSelector
          v-model="selectedPaymentMethod"
          :amount="totalAmountToPay"
          :eventId="eventParams"
        />
      </div>
      
      <!-- Paso 3: Confirmación -->
      <div v-else-if="activeStep === 3" class="w-full">
        <PaymentSummary
          :amount="totalAmountToPay"
          :payment-method="selectedPaymentMethod"
          :email="email"
          :event-id="eventParams"
          ref="paymentSummaryRef"
        />
      </div>
      
      <!-- Botones de navegación -->
      <div class="controllers mt-4 grid grid-cols-2 justify-items-stretch w-full">
        <button 
          v-if="activeStep > 1" 
          class="btn justify-self-start" 
          @click="activeStep -= 1"
        >
          Anterior
        </button>
        <div v-else class="w-10"></div>
        
        <button 
          v-if="activeStep < 3" 
          class="btn btn-primary justify-self-end text-white" 
          :disabled="isNextButtonDisabled"
          @click="nextStep"
        >
          Siguiente
        </button>
        
        <button 
          v-if="activeStep === 3" 
          class="btn btn-primary justify-self-end text-white" 
          :disabled="isLoading"
          @click="confirmPayment"
        >
          <span v-if="!isLoading">Confirmar pago</span>
          <span v-else>Procesando...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { createPaymentLink } from '@/services/mercadoPago';
import { useRouter, useRoute } from 'vue-router';
import { doc, getDoc, updateDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import AmountSelector from '@/components/AmountSelector.vue';
import PaymentMethodSelector from '@/components/PaymentMethodSelector.vue';
import PaymentSummary from '@/components/PaymentSummary.vue';

export default {
  name: 'CheckoutPage',
  components: {
    AmountSelector,
    PaymentMethodSelector,
    PaymentSummary
  },
  setup() {

const router = useRouter();
const route = useRoute();

// Variables para el flujo de pasos
const activeStep = ref(1);
const selectedPaymentMethod = ref('card'); // 'card' o 'transfer'
const paymentSummaryRef = ref(null);

// Variables reactivas para información del pago
const isLoading = ref(false);
const spectator = ref(null);
const amount = reactive([10000]);
const description = ref('Tu experiencia 40 Minutos');
const email = ref('');
const emailError = ref('');
const baseUrl = ref('');
const spectatorParams = ref('');
const eventParams = ref('');
const uniquePaymentForGroup = ref(true);

// Calcular el monto total a pagar
const totalAmountToPay = computed(() => {
  if (uniquePaymentForGroup.value && spectator.value && spectator.value.numberOfPeople > 1) {
    return amount[0] * spectator.value.numberOfPeople;
  } else {
    return amount.reduce((total, val) => total + parseFloat(val), 0);
  }
});

// Validación para el botón de siguiente
const isNextButtonDisabled = computed(() => {
  if (activeStep.value === 1) {
    // Validar email y monto en el paso 1
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailPattern.test(email.value);
    return totalAmountToPay.value <= 0 || !isEmailValid || isLoading.value;
  } else if (activeStep.value === 2) {
    // Validar método de pago seleccionado en el paso 2
    return !selectedPaymentMethod.value;
  }
  return false;
});

// Métodos para actualizar los valores desde los componentes hijos
const updateAmount = (newAmounts) => {
  for (let i = 0; i < newAmounts.length; i++) {
    if (i < amount.length) {
      amount[i] = newAmounts[i];
    } else {
      amount.push(newAmounts[i]);
    }
  }
  // Ajustar el tamaño del array si es necesario
  if (amount.length > newAmounts.length) {
    amount.splice(newAmounts.length);
  }
};

const updateUniquePaymentForGroup = (value) => {
  uniquePaymentForGroup.value = value;
};

// Avanzar al siguiente paso con validación
const nextStep = () => {
  if (activeStep.value === 1) {
    validateEmail();
    if (emailError.value || totalAmountToPay.value <= 0) {
      return;
    }
  }
  activeStep.value += 1;
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

// Cargar datos del espectador al iniciar
const fetchSpectator = async () => {
  isLoading.value = true;
  try {
    const spectatorDocRef = doc(db, 'spectators', spectatorParams.value);
    const eventDocRef = doc(db, 'events', eventParams.value);
    
    const [spectatorSnap, eventSnap] = await Promise.all([
      getDoc(spectatorDocRef),
      getDoc(eventDocRef)
    ]);
    
    if (spectatorSnap.exists() && eventSnap.exists()) {
      spectator.value = spectatorSnap.data();
      email.value = spectator.value.email || '';
      
      // Buscar el espectador en zSpectator del evento
      const eventData = eventSnap.data();
      const spectatorInEvent = eventData.zSpectator?.find(s => s.spectatorId === spectatorParams.value);
      
      if (spectatorInEvent) {
        const numberOfPeople = spectatorInEvent.numberOfCompanions + 1;
        spectator.value.numberOfPeople = numberOfPeople;
      } else {
        console.error('No se encontró el espectador en el evento');
      }
    } else {
      console.error('No se encontró el documento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos:', error);
  } finally {
    isLoading.value = false;
  }
};

// Confirmar el pago según el método seleccionado
const confirmPayment = async () => {
  isLoading.value = true;
  
  try {
    // Crear un registro de pago independientemente del método
    const paymentData = {
      amount: totalAmountToPay.value,
      eventId: eventParams.value,
      spectatorId: spectatorParams.value,
      method: selectedPaymentMethod.value === 'card' ? 'mercadoPago' : 'bankTransfer',
      status: 'pending',
      createdAt: new Date(),
      metadata: {
        uniquePaymentForGroup: uniquePaymentForGroup.value,
        email: email.value
      }
    };
    
    // Crear el documento en la colección payments
    const paymentRef = doc(collection(db, 'payments'));
    const paymentId = paymentRef.id;
    await setDoc(paymentRef, paymentData);
    
    // Actualizar el campo paymentId en zSpectator
    const eventRef = doc(db, 'events', eventParams.value);
    const eventDoc = await getDoc(eventRef);
    
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      const zSpectator = eventData.zSpectator || [];
      
      const spectatorIndex = zSpectator.findIndex(s => s.spectatorId === spectatorParams.value);
      
      if (spectatorIndex !== -1) {
        zSpectator[spectatorIndex] = {
          ...zSpectator[spectatorIndex],
          paymentId: paymentId
        };
        
        await updateDoc(eventRef, {
          zSpectator: zSpectator
        });
      }
    }
    
    // Proceder según el método de pago seleccionado
    if (selectedPaymentMethod.value === 'card') {
      // Generar el link de pago de MercadoPago y redirigir
      // Asegurar que usamos HTTPS para todas las URLs de retorno
      const secureBaseUrl = baseUrl.value.replace('http://', 'https://');
      
      const paymentLink = await createPaymentLink({
        amount: totalAmountToPay.value,
        description: description.value,
        email: email.value,
        backUrls: {
          success: `${secureBaseUrl}/thankyou?idSpectator=${spectatorParams.value}&paymentId=${paymentId}&idEvent=${eventParams.value}`,
          failure: `${secureBaseUrl}/thankyou?idSpectator=${spectatorParams.value}&paymentId=${paymentId}&idEvent=${eventParams.value}`,
          pending: `${secureBaseUrl}/thankyou?idSpectator=${spectatorParams.value}&paymentId=${paymentId}&idEvent=${eventParams.value}`,
        },
      });
      
      // Redirigir al usuario a la página de pago
      window.open(paymentLink, '_self');
    } else {
      // Redirigir a la página de agradecimiento para transferencia bancaria
      router.push({
        name: 'ThankYou',
        query: { 
          idSpectator: spectatorParams.value,
          idEvent: eventParams.value,
          paymentMethod: 'bankTransfer',
          paymentId: paymentId,
          amount: totalAmountToPay.value
        }
      });
    }
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    alert('Hubo un problema al procesar el pago. Por favor, intenta de nuevo.');
    isLoading.value = false;
  }
};

// Inicializar la página
onMounted(() => {
  baseUrl.value = window.location.origin;
  spectatorParams.value = route.params.idSpectator;
  eventParams.value = route.params.idEvent;
  
  if (spectatorParams.value) {
    fetchSpectator();
  }
});

    // Retornar todas las variables reactivas y funciones para que estén disponibles en el template
    return {
      activeStep,
      selectedPaymentMethod,
      paymentSummaryRef,
      isLoading,
      spectator,
      amount,
      email,
      emailError,
      spectatorParams,
      eventParams,
      uniquePaymentForGroup,
      totalAmountToPay,
      isNextButtonDisabled,
      updateAmount,
      updateUniquePaymentForGroup,
      nextStep,
      confirmPayment
    };
  }
};
</script>

<style>
/* Estilos adicionales si son necesarios */
</style>
