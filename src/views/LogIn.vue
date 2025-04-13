<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="router.push({name:'Home'})">Volver</button>
    <div class="flex flex-col items-center mb-10">
      <img src="../assets/logo_horizontal.png" width="150">
    </div>

    <form @submit.prevent="login">
      <div class="form-group mb-4">
        <label class="block text-sm font-medium mb-2" for="email"><strong>Email</strong></label>
        <input 
          id="email"
          v-model="email" 
          type="email" 
          placeholder="Email" 
          class="input input-bordered w-full" 
          required 
        />
      </div>
      
      <PasswordField
        v-model="password"
        id="login-password"
        label="Contraseña"
        placeholder="Contraseña"
        class="mb-4"
        :error="passwordError"
      />
      
      <button
        type="submit"
        class="btn-md btn btn-primary text-white w-full mt-4"
        :disabled="isLoading"
      >
        <span v-if="!isLoading">Entrar</span>
        <span v-else class="loading loading-dots loading-sm"></span>
      </button>
      
      <!-- Mensaje de error -->
      <div v-if="errorMessage" class="alert alert-error mt-4">
        {{ errorMessage }}
      </div>
    </form>
    
    <button
      @click="router.push({name:'PasswordReset'})"
      class="btn-md btn btn-link btn-primary text-black w-full mt-4"
    >
      <span>Recuperar contraseña</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import PasswordField from '@/components/PasswordField.vue';

// Estado del formulario
const email = ref('');
const password = ref('');
const passwordError = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// Router y route
const router = useRouter();
const route = useRoute();

const eventId = route.params.idEvent;
// const validatePhone = () => {
//   const phonePattern = /^\+56\d{9}$/; // Formato para números de teléfono en Chile: +56XXXXXXXXX
//   if (!phonePattern.test(phone.value)) {
//     phoneError.value = 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX.';
//     isButtonDisabled.value = true;
//   } else {
//     phoneError.value = '';
//     isButtonDisabled.value = false;
//   }
// };

// Función para verificar la suscripción del espectador
// const checkSpectatorSubscriptions = async () => {
//   const db = getFirestore();
//   const spectatorsRef = collection(db, 'spectators');
//   const q = query(spectatorsRef, where('phone', '==', phone.value));

//   try {
//     const querySnapshot = await getDocs(q);
//     if (!querySnapshot.empty) {
//       // Si se encuentra una coincidencia, redirige a la ruta /profile/:id
//       const doc = querySnapshot.docs[0];
//       router.push({ name: 'Profile', params: { idSpectator: doc.id } });
//     } else {
//       alert('Número no encontrado.');
//     }
//   } catch (error) {
//     console.error('Error al verificar la suscripción:', error);
//     alert('Hubo un problema al verificar la suscripción.');
//   }
// };

const login = async () => {
  // Evitar múltiples envíos
  if (isLoading.value) return;
  
  // Resetear errores
  passwordError.value = '';
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    // Intentar inicio de sesión
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    
    // Buscar datos del espectador
    const db = getFirestore();
    const spectatorsRef = collection(db, 'spectators');
    const q = query(spectatorsRef, where('email', '==', email.value));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      console.log('Usuario logueado:', userCredential.user);
      
      // Redirigir al perfil con parámetros adicionales
      router.push({ 
        name: 'Profile', 
        params: { idSpectator: docData.id }, 
        query: { idEvent: eventId, from: 'login' } 
      });
    } else {
      errorMessage.value = 'Usuario no encontrado en el sistema.';
    }
  } catch (error) {
    console.error('Error de inicio de sesión:', error);
    
    // Manejar diferentes errores de autenticación
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      passwordError.value = 'Contraseña incorrecta.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage.value = 'No existe una cuenta con este correo electrónico.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage.value = 'El formato del correo electrónico no es válido.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage.value = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
    } else {
      errorMessage.value = 'Error al iniciar sesión: ' + (error.message || 'Error desconocido');
    }
  } finally {
    isLoading.value = false;
  }
};
</script>