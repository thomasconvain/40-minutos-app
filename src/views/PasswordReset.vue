<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="$router.go(-1)">Volver</button>
    <div class="card bg-base-100 border border-base-600 mt-6">
      <div class="card-body">
        <h2 class="card-title mt-8">
          Restablecer contraseña
        </h2>
        <form @submit.prevent="handleReset">
          <div class="flex flex-col">
            <label class="text-sm" for="email"><strong>Email</strong></label>
            <input v-model="email" type="string" id="email" class="input input-bordered w-full" required />
          </div>

          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full mt-4"
          >
            <span v-if="!isLoading">Enviar correo de restablecimiento</span>
            <span v-else class="loading loading-dots loading-sm"></span>
          </button>
          <p v-if="message" class="text-green-500 text-sm mt-1">{{ message }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const email = ref('');
const message = ref('');

const isLoading = ref(false);

const auth = getAuth();

const handleReset = async () => {
  isLoading.value = true;
  try {
    await sendPasswordResetEmail(auth, email.value);
    message.value = "Se ha enviado un correo para restablecer tu contraseña.";
  } catch (error) {
    message.value = "Error al enviar el correo: " + error.message;
  }
  isLoading.value = false;
};
</script>
