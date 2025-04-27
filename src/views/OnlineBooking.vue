<template>
  <div class="reservation-container">
    <!-- Cabecera con título y botón volver -->
    <div class="flex justify-between items-center mt-8">
      <h1 class="card-title">Reserva tu cupo</h1>
      <button 
        class="btn bg-white border-none" 
        @click="showForm ? showForm = false : $router.go(-1)"
      >
        Volver
      </button>
    </div>
    
    <!-- Selector de número de personas - siempre visible -->
    <div class="form-group mt-2 mb-6">
      <label class="text-sm font-bold" for="numberOfPeople">¿Cuántas personas asistirán?</label>
      <input 
        v-model="numberOfPeople" 
        type="number" 
        min="1" 
        placeholder="Ingresa el número total de participantes" 
        id="numberOfPeople" 
        class="input input-bordered w-full" 
        required 
      />
      <p v-if="numberOfPeople >= 2" class="text-yellow-600 text-sm mt-1">Se recomienda ir con niños mayores de 10 años</p>
    </div>
    
    <!-- Opciones iniciales -->
    <div v-if="!showForm" class="options-container">
      <!-- Opción para nuevos usuarios -->
      <div class="option-group mb-2">
        <button
          @click="showForm = true"
          type="button"
          class="btn-md btn btn-primary text-white w-full"
          :disabled="isLoading"
        >
          <span>Continuar</span>
        </button>
      </div>
      <!-- Opción para usuarios existentes -->
      <div class="option-group">
        <button
          @click="goToLogin"
          type="button"
          class="btn-md btn btn-outline text-primary w-full border-primary hover:bg-primary hover:text-white"
          :disabled="isLoading"
        >
          <span>Reservar con mis datos guardados</span>
        </button>
      </div>
      
    </div>
    
    <!-- Formulario completo -->
    <form v-if="showForm" @submit.prevent="submitForm" class="reservation-form mt-4">
      <!-- Campos personales -->
      <div class="form-group mt-2" >
        <label class="text-sm font-bold" for="name">Nombre</label>
        <input 
          v-model="name" 
          type="text" 
          id="name" 
          class="input input-bordered w-full" 
          required 
        />
      </div>

      <div class="form-group mt-2">
        <label class="text-sm font-bold" for="lastName">Apellidos</label>
        <input 
          v-model="lastName" 
          type="text" 
          id="lastName" 
          class="input input-bordered w-full" 
          required 
        />
      </div>

      <div class="form-group mt-2">
        <label class="text-sm font-bold" for="email">Email</label>
        <input 
          v-model="email" 
          type="email" 
          id="email" 
          class="input input-bordered w-full" 
          required 
          @blur="validateEmail"
        />
        <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
      </div>

      <div class="form-group mt-2">
        <label class="text-sm font-bold" for="phone">Teléfono</label>
        <input 
          v-model="phone" 
          type="tel" 
          id="phone" 
          class="input input-bordered w-full" 
          required 
          @blur="validatePhone"
        />
        <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
      </div>

      <!-- Botón de envío -->
      <button
        type="submit"
        class="btn-md btn btn-primary text-white w-full mt-6"
        :disabled="isLoading"
      >
        <span v-if="isLoading">Procesando...</span>
        <span v-else>Reservar</span>
      </button>
      
      <!-- Mensaje de error general -->
      <p v-if="errorMessage" class="text-red-500 text-center mt-4">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter, useRoute } from 'vue-router';
import { addSpectatorToEvent } from '@/utils';

// Router y auth
const auth = getAuth();
const router = useRouter();
const route = useRoute();

// Estado del formulario
const showForm = ref(false);
const isLoading = ref(false);

// Campos del formulario
const numberOfPeople = ref(1);
const name = ref('');
const lastName = ref('');
const email = ref('');
const phone = ref('+56');
const password = ref('');
const confirmPassword = ref('');

// Valores calculados
const numberOfCompanions = computed(() => 
  numberOfPeople.value === 1 ? 0 : (numberOfPeople.value - 1)
);

// Configuración adicional
const isChecked = ref(false);
const uniquePaymentForGroup = ref(true);

// Mensajes de error
const emailError = ref('');
const phoneError = ref('');
const confirmPasswordError = ref('');
const errorMessage = ref('');

// Inicialización
onMounted(() => {
  password.value = route.params.idEvent;
  confirmPassword.value = route.params.idEvent;
});

// Validaciones
const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailError.value = emailPattern.test(email.value)
    ? ''
    : 'Por favor ingresa un correo válido.';
  return emailError.value === '';
};

const validatePhone = () => {
  const phonePattern = /^\+56\d{9}$/;
  phoneError.value = phonePattern.test(phone.value)
    ? ''
    : 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX.';
  return phoneError.value === '';
};

const validatePasswords = () => {
  if (password.value.length < 6) {
    confirmPasswordError.value = 'La contraseña debe tener al menos 6 caracteres.';
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Las contraseñas no coinciden.';
  } else {
    confirmPasswordError.value = '';
  }
  return confirmPasswordError.value === '';
};

const validateForm = () => {
  const isEmailValid = validateEmail();
  const isPhoneValid = validatePhone();
  const isPasswordValid = validatePasswords();
  return isEmailValid && isPhoneValid && isPasswordValid;
};

// Acciones
const goToLogin = () => {
  router.push({
    name: 'LogIn', 
    params: { idEvent: route.params.idEvent },
    query: { 
      ...route.query,
      numberOfPeople: numberOfPeople.value 
    }
  });
};

const submitForm = async () => {
  try {
    isLoading.value = true;
    
    if (!validateForm()) {
      return;
    }
    
    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    
    // Preparar datos para Firestore
    const spectatorData = {
      email: email.value,
      uId: user.uid,
      hostId: route.query.hostId ? route.query.hostId : 'none',
      name: name.value,
      lastName: lastName.value,
      phone: phone.value,
      numberOfPeople: numberOfPeople.value,
      numberOfCompanions: numberOfCompanions.value,
      isChecked: isChecked.value,
      uniquePaymentForGroup: uniquePaymentForGroup.value,
      subscribedEventsId: route.params.idEvent.split(',').map(id => id.trim()),
    };
    
    // Guardar en Firestore
    await setDoc(doc(db, 'spectators', user.uid), spectatorData);
    
    // Para cada evento al que se suscribe, añadir el espectador al evento
    const eventIds = route.params.idEvent.split(',').map(id => id.trim());
    for (const eventId of eventIds) {
      // Solo guardar en zSpectator los datos mínimos requeridos según el nuevo modelo
      const spectatorForEvent = {
        id: user.uid,
        numberOfCompanions: numberOfCompanions.value
      };
      
      // Añadir espectador al evento (ahora solo actualiza zSpectator)
      await addSpectatorToEvent(eventId, spectatorForEvent);
    }
    
    // Redirigir al perfil (indicando que viene de OnlineBooking)
    router.push({ 
      name: 'Profile', 
      params: { idSpectator: user.uid }, 
      query: { 
        idEvent: route.params.idEvent,
        from: 'booking' // Añadir indicador de origen
      } 
    });
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      emailError.value = 'Ya tienes cuentas, debes reservar con la opción de "usar datos guardados"';
    } else {
      errorMessage.value = 'Error al crear usuario: ' + error.message;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.reservation-container {
  max-width: 100%;
}
</style>