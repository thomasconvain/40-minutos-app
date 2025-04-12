<template>
  <div class="password-reset-container">
    <!-- Botón de navegación -->
    <div class="navigation mb-4">
      <button 
        class="btn bg-white border-none hover:bg-gray-100" 
        @click="$router.go(-1)"
        aria-label="Volver a la página anterior"
      >
        Volver
      </button>
    </div>
    
    <!-- Tarjeta principal -->
    <div class="card bg-base-100 border border-base-600 shadow-sm">
      <div class="card-body p-6">
        <h2 class="card-title mb-4">Restablecer contraseña</h2>
        
        <!-- Formulario de restablecimiento -->
        <form @submit.prevent="handleReset">
          <div class="form-group mb-6">
            <label class="text-sm font-medium block mb-2" for="email">Email</label>
            <input 
              v-model="email" 
              type="email" 
              id="email" 
              class="input input-bordered w-full" 
              placeholder="correo@ejemplo.com"
              autocomplete="email"
              required 
            />
          </div>

          <!-- Botón de envío -->
          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Enviar link de restablecimiento</span>
            <span v-else class="loading loading-dots loading-sm"></span>
          </button>
          
          <!-- Mensaje de respuesta -->
          <div 
            v-if="message" 
            class="mt-4 p-3 rounded-md mb-4" 
            :class="messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            <p>{{ message }}</p>
            <p v-if="errorCode" class="text-sm mt-2">Código de error: {{ errorCode }}</p>
          </div>
          
          <!-- Botón para ir a Home, siempre visible -->
          <div class="mt-6 text-center">
            <button 
              class="btn bg-white border-none" 
              @click="goToHome"
            >
              Volver al home
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from 'vue-router';

// Estado del formulario
const email = ref('');
const message = ref('');
const messageType = ref('');
const errorCode = ref('');
const isLoading = ref(false);

// Servicio de autenticación
const auth = getAuth();
const router = useRouter();

/**
 * Navega a la página Home
 */
const goToHome = () => {
  router.push({ name: 'Home' });
};

/**
 * Maneja el envío del formulario de restablecimiento de contraseña
 */
const handleReset = async () => {
  // Evita múltiples envíos
  if (isLoading.value) return;
  
  isLoading.value = true;
  message.value = '';
  errorCode.value = '';
  
  try {
    // Enviar directamente el correo de recuperación sin verificación previa
    console.log('Enviando correo de restablecimiento a:', email.value);
    await sendPasswordResetEmail(auth, email.value);
    
    messageType.value = 'success';
    message.value = "Se ha enviado un correo para restablecer tu contraseña.";
    console.log('Correo de restablecimiento enviado con éxito');
  } catch (error) {
    console.error('Error completo:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje de error:', error.message);
    
    messageType.value = 'error';
    errorCode.value = error.code || 'unknown-error';
    
    // Personalizar mensajes de error comunes para mejorar la experiencia de usuario
    if (error.code === 'auth/user-not-found') {
      message.value = "No existe una cuenta asociada a este correo. Debes hacer la reserva por primera vez.";
    } else if (error.code === 'auth/invalid-email') {
      message.value = "El formato del correo electrónico no es válido.";
    } else if (error.code === 'auth/missing-email') {
      message.value = "Por favor, ingresa tu dirección de correo electrónico.";
    } else if (error.code === 'auth/too-many-requests') {
      message.value = "Demasiados intentos. Por favor, inténtalo más tarde.";
    } else if (error.code === 'auth/network-request-failed') {
      message.value = "Error de conexión. Verifica tu conexión a internet e intenta nuevamente.";
    } else {
      message.value = "Error al enviar el correo: " + error.message;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.password-reset-container {
  max-width: 480px;
  margin: 0 auto;
}

.form-group label {
  font-weight: 500;
}

.card {
  border-radius: 8px;
}
</style>