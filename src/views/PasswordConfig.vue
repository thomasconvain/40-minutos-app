<template>
  <div class="password-reset-container max-w-md mx-auto p-4">
    <!-- Navegación -->
    <div class="flex justify-between items-center mb-4">
      <button class="btn bg-white border-none hover:bg-gray-100" @click="router.push({name:'Home'})">
        Volver
      </button>
    </div>
    
    <h2 class="text-2xl font-semibold mb-4">Restablecer contraseña</h2>
    
    <div class="card bg-base-100 border border-base-600 shadow-md rounded-lg overflow-hidden">
      <div class="card-body p-6">
        <!-- Mensajes de estado -->
        <div v-if="isLoading" class="flex justify-center items-center py-4">
          <div class="loading loading-dots loading-md"></div>
          <span class="ml-2">Verificando enlace...</span>
        </div>

        <!-- Mensajes de éxito o error -->
        <div v-if="successMessage" class="p-3 mb-4 bg-green-100 text-green-800 rounded-md">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="p-3 mb-4 bg-red-100 text-red-800 rounded-md">
          <p>{{ errorMessage }}</p>
          <p v-if="errorCode" class="text-sm mt-2">Código de error: {{ errorCode }}</p>
          <p v-if="isExpiredLink" class="font-medium mt-2">
            El enlace de restablecimiento ha expirado. Por favor, solicita un nuevo enlace desde la página de inicio de sesión.
          </p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleResetPassword" v-if="!successMessage && isValidCode && !isLoading">
          <div class="form-group mb-4">
            <label class="block mb-2 font-medium" for="password">Nueva contraseña</label>
            <input
              type="password"
              id="password"
              v-model="password"
              class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Mínimo 6 caracteres"
              required
              minlength="6"
              @input="validatePassword"
            />
            <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
          </div>

          <div class="form-group mb-4">
            <label class="block mb-2 font-medium" for="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              class="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
              @input="validateConfirmPassword"
            />
            <p v-if="confirmPasswordError" class="text-red-500 text-sm mt-1">{{ confirmPasswordError }}</p>
          </div>

          <div class="password-requirements text-sm text-gray-600 mb-4">
            <p class="mb-1">La contraseña debe:</p>
            <ul class="list-disc pl-5">
              <li :class="{'text-green-600': password.length >= 6}">Tener al menos 6 caracteres</li>
              <li :class="{'text-green-600': /[A-Z]/.test(password)}">Incluir al menos una letra mayúscula</li>
              <li :class="{'text-green-600': /[0-9]/.test(password)}">Incluir al menos un número</li>
            </ul>
          </div>

          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full mt-4"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="loading loading-dots loading-sm"></span>
            <span v-else>Guardar nueva contraseña</span>
          </button>
        </form>
        
        <!-- Botón para ir a login -->
        <div v-if="successMessage || (!isValidCode && !isLoading)" class="text-center mt-4">
          <button
            class="btn btn-outline btn-primary"
            @click="router.push('/login')"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
  getAuth,
} from 'firebase/auth';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/firebase';

// Router y parámetros
const route = useRoute();
const router = useRouter();
const auth = getAuth();

// Estado del formulario
const password = ref('');
const confirmPassword = ref('');
const oobCode = ref('');
const email = ref('');
const uid = ref('');

// Estado de validación
const passwordError = ref('');
const confirmPasswordError = ref('');
const errorCode = ref('');
const isExpiredLink = ref(false);

// Estado UI
const successMessage = ref('');
const errorMessage = ref('');
const isLoading = ref(true);
const isSubmitting = ref(false);
const isValidCode = ref(false);

// Propiedades computadas
const isFormValid = computed(() => {
  return password.value.length >= 6 && 
         /[A-Z]/.test(password.value) && 
         /[0-9]/.test(password.value) &&
         password.value === confirmPassword.value;
});

// Decodificación de parámetros de URL
const getDecodedOobCode = () => {
  const rawCode = route.query.oobCode;
  if (!rawCode) return null;
  
  // A veces el código puede contener caracteres especiales que necesitan ser decodificados
  try {
    return decodeURIComponent(rawCode);
  } catch (e) {
    console.error('Error al decodificar oobCode:', e);
    return rawCode; // Si hay un error de decodificación, usar el valor original
  }
};

// Validación de contraseñas
const validatePassword = () => {
  passwordError.value = '';
  
  if (password.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.';
    return false;
  }
  
  if (!/[A-Z]/.test(password.value)) {
    passwordError.value = 'La contraseña debe incluir al menos una letra mayúscula.';
    return false;
  }
  
  if (!/[0-9]/.test(password.value)) {
    passwordError.value = 'La contraseña debe incluir al menos un número.';
    return false;
  }
  
  return true;
};

const validateConfirmPassword = () => {
  confirmPasswordError.value = '';
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Las contraseñas no coinciden.';
    return false;
  }
  return true;
};

// Inicialización y verificación de código
onMounted(async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    errorCode.value = '';
    
    // Obtener y decodificar el código del enlace
    oobCode.value = getDecodedOobCode();
    
    if (!oobCode.value) {
      isValidCode.value = false;
      errorMessage.value = 'No se ha proporcionado un código de restablecimiento.';
      return;
    }

    console.log('Verificando código de restablecimiento');
    // Verificar el código y obtener el email
    email.value = await verifyPasswordResetCode(auth, oobCode.value);
    console.log('Código verificado para el email:', email.value);
    isValidCode.value = true;
  } catch (error) {
    console.error('Error completo:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje de error:', error.message);
    
    isValidCode.value = false;
    errorCode.value = error.code || 'unknown-error';
    
    // Manejar códigos de error específicos
    if (error.code === 'auth/expired-action-code') {
      errorMessage.value = 'El enlace de restablecimiento ha expirado.';
      isExpiredLink.value = true;
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage.value = 'El enlace de restablecimiento no es válido o ya ha sido utilizado.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage.value = 'La cuenta de usuario está deshabilitada.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage.value = 'No se encontró ninguna cuenta con este correo electrónico.';
    } else {
      errorMessage.value = `Error al verificar el enlace de restablecimiento: ${error.message}`;
    }
  } finally {
    isLoading.value = false;
  }
});

// Función principal para resetear la contraseña
const handleResetPassword = async () => {
  // Evitar múltiples envíos
  if (isSubmitting.value) return;
  
  // Limpiar mensajes previos
  errorMessage.value = '';
  errorCode.value = '';
  
  // Validar formulario
  const isPasswordValid = validatePassword();
  const isConfirmValid = validateConfirmPassword();
  
  if (!isPasswordValid || !isConfirmValid) {
    return;
  }
  
  try {
    isSubmitting.value = true;
    console.log('Iniciando cambio de contraseña con código:', oobCode.value);
    
    // Confirmar el reseteo de contraseña
    await confirmPasswordReset(auth, oobCode.value, password.value);
    console.log('Contraseña actualizada correctamente en Firebase Auth');
    
    // Buscar documento en 'spectators' por email
    console.log('Buscando usuario con email:', email.value);
    const spectatorQuery = query(
      collection(db, 'spectators'), 
      where('email', '==', email.value)
    );
    
    const querySnapshot = await getDocs(spectatorQuery);
    console.log('Resultados encontrados:', querySnapshot.size);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      uid.value = docSnap.id;
      console.log('Usuario encontrado con ID:', uid.value);

      const userData = docSnap.data();
      console.log('Datos actuales del usuario:', userData);

      try {
        // Actualizar solo si passwordChanged no es true
        const userRef = doc(db, 'spectators', uid.value);
        await updateDoc(userRef, {
          passwordChanged: true,
        });
        console.log('Campo passwordChanged actualizado correctamente');
      } catch (firestoreError) {
        console.error('Error al actualizar passwordChanged:', firestoreError);
        // No fallar todo el proceso si solo falla la actualización de Firestore
      }
    } else {
      console.warn('No se encontró el usuario con email:', email.value);
    }

    // Mostrar mensaje de éxito
    successMessage.value = '¡Contraseña actualizada con éxito!';
    
    // Redirigir después de un tiempo
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error) {
    console.error('Error completo al resetear contraseña:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje de error:', error.message);
    
    errorCode.value = error.code || 'unknown-error';
    
    // Manejar códigos de error específicos
    if (error.code === 'auth/expired-action-code') {
      errorMessage.value = 'El enlace de restablecimiento ha expirado.';
      isExpiredLink.value = true;
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage.value = 'El enlace de restablecimiento no es válido o ya ha sido utilizado.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage.value = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage.value = 'Esta operación es sensible y requiere autenticación reciente.';
    } else {
      errorMessage.value = `Error al actualizar la contraseña: ${error.message || 'Intenta nuevamente.'}`;
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.password-reset-container {
  max-width: 480px;
  margin: 0 auto;
}

.loading {
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  animation: loading 1s infinite ease-in-out;
}

@keyframes loading {
  0%, 100% { transform: scale(0); }
  50% { transform: scale(1); }
}
</style>