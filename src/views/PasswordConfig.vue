<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="goBack">Volver</button>
    <h2 class="text-2xl font-semibold mb-4">Restablecer contraseña</h2>
    <div class="card bg-base-100 border border-base-600 mt-6">
      <div class="card-body">
        <!-- Indicador de carga -->
        <div v-if="isVerifying" class="flex justify-center py-4">
          <div class="loading loading-spinner loading-md"></div>
          <span class="ml-2">Verificando enlace...</span>
        </div>
        
        <!-- Mensajes de estado -->
        <div v-if="successMessage" class="bg-green-100 text-green-800 p-4 rounded-md mb-4">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="bg-red-100 text-red-800 p-4 rounded-md mb-4">
          <p>{{ errorMessage }}</p>
          <p v-if="errorCode" class="text-sm mt-2">Código de error: {{ errorCode }}</p>
        </div>

        <form v-if="!successMessage && !isVerifying" @submit.prevent="handleResetPassword">
          <PasswordField
            v-model="password"
            id="new-password"
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            :min-length="6"
            class="mb-4"
            :error="passwordError"
          />

          <PasswordField
            v-model="confirmPassword"
            id="confirm-password"
            label="Confirmar contraseña"
            placeholder="Repita la contraseña"
            class="mb-4"
            :error="confirmPasswordError"
          />

          <!-- Requisitos de contraseña -->
          <div class="password-requirements text-sm text-gray-600 mb-4">
            <p class="mb-1">La contraseña debe:</p>
            <ul class="list-disc pl-5">
              <li :class="{'text-green-600': password.length >= 6}">Tener al menos 6 caracteres</li>
            </ul>
          </div>

          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full mt-4"
            :disabled="isSubmitting"
          >
            <span v-if="!isSubmitting">Guardar nueva contraseña</span>
            <span v-else class="loading loading-dots loading-sm"></span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import PasswordField from '@/components/PasswordField.vue';

// Router y rutas
const route = useRoute();
const router = useRouter();

// Estado del formulario
const password = ref('');
const confirmPassword = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');
const errorCode = ref('');

// Estado UI
const isVerifying = ref(true);
const isSubmitting = ref(false);

// Datos de la operación
const oobCode = ref('');
const email = ref('');
const uid = ref('');

const goBack = () => {
  router.push({name:'Home'});
};

// Obtener y validar el código oobCode
const getDecodedOobCode = () => {
  if (!route || !route.query) return null;
  const rawCode = route.query.oobCode;
  if (!rawCode) return null;
  
  try {
    return decodeURIComponent(rawCode);
  } catch (e) {
    console.error('Error al decodificar oobCode:', e);
    return rawCode;
  }
};

// Validar contraseñas
const validatePasswords = () => {
  // Resetear errores
  passwordError.value = '';
  confirmPasswordError.value = '';
  
  // Validar longitud mínima
  if (password.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.';
    return false;
  }
  
  // Validar coincidencia
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Las contraseñas no coinciden.';
    return false;
  }
  
  return true;
};

// Inicialización
onMounted(() => {
  nextTick(async () => {
    try {
      isVerifying.value = true;
      errorMessage.value = '';
      
      // Obtener y decodificar el código
      oobCode.value = getDecodedOobCode();
      
      if (!oobCode.value) {
        errorMessage.value = 'El enlace no contiene un código de restablecimiento válido.';
        errorCode.value = 'missing-code';
        isVerifying.value = false;
        return;
      }

      console.log('Verificando código de restablecimiento');
      
      // Verificar el código y obtener el email
      email.value = await verifyPasswordResetCode(auth, oobCode.value);
      console.log('Código válido para el email:', email.value);
      
    } catch (error) {
      console.error('Error al verificar el código:', error);
      errorCode.value = error.code || 'unknown-error';
      
      // Manejar tipos de error específicos
      if (error.code === 'auth/expired-action-code') {
        errorMessage.value = 'El enlace de restablecimiento ha expirado. Por favor, solicita un nuevo enlace.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage.value = 'El enlace de restablecimiento no es válido o ya ha sido utilizado.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage.value = 'La cuenta asociada a este correo ha sido deshabilitada.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage.value = 'No se encontró ninguna cuenta con este correo electrónico.';
      } else {
        errorMessage.value = `Error al verificar el enlace: ${error.message || 'Ha ocurrido un error desconocido.'}`;
      }
    } finally {
      isVerifying.value = false;
    }
  });
});

// Manejar reseteo de contraseña
const handleResetPassword = async () => {
  // Evitar múltiples envíos
  if (isSubmitting.value) return;
  
  // Validar contraseñas
  if (!validatePasswords()) {
    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    errorCode.value = '';
    
    console.log('Iniciando cambio de contraseña');
    
    // Confirmar el reseteo de contraseña
    await confirmPasswordReset(auth, oobCode.value, password.value);
    console.log('Contraseña actualizada correctamente en Firebase Auth');
    
    // Buscar y actualizar el documento del usuario
    await updateUserDocument();

    // Mostrar mensaje de éxito
    successMessage.value = '¡Contraseña actualizada con éxito!';
    
    // Redirigir después de un tiempo
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    errorCode.value = error.code || 'unknown-error';
    
    // Manejar códigos de error específicos
    if (error.code === 'auth/expired-action-code') {
      errorMessage.value = 'El enlace de restablecimiento ha expirado.';
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage.value = 'El enlace de restablecimiento no es válido o ya ha sido utilizado.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage.value = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage.value = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    } else {
      errorMessage.value = `Error al actualizar la contraseña: ${error.message || 'Ha ocurrido un error desconocido.'}`;
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Función para actualizar el documento del usuario
const updateUserDocument = async () => {
  try {
    if (!email.value) {
      console.warn('No hay email disponible para actualizar el documento');
      return;
    }
    
    // Buscar documento en 'spectators' por email
    console.log('Buscando usuario con email:', email.value);
    const q = query(collection(db, 'spectators'), where('email', '==', email.value));
    const querySnapshot = await getDocs(q);
    console.log('Resultados encontrados:', querySnapshot.size);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      uid.value = docSnap.id;
      console.log('Usuario encontrado con ID:', uid.value);

      const data = docSnap.data();
      
      // Actualizar solo si passwordChanged no es true
      if (!data.passwordChanged) {
        console.log('Actualizando campo passwordChanged a true');
        const userRef = doc(db, 'spectators', uid.value);
        await updateDoc(userRef, {
          passwordChanged: true,
        });
        console.log('Campo passwordChanged actualizado correctamente');
      } else {
        console.log('El campo passwordChanged ya está en true, no se actualiza');
      }
    } else {
      console.warn('No se encontró usuario con email:', email.value);
    }
  } catch (error) {
    console.error('Error al actualizar documento de usuario:', error);
    // No lanzamos el error para que no interrumpa el flujo principal
  }
};
</script>

<style scoped>
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