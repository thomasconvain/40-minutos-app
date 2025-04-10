<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="router.push({name:'Home'})">Volver</button>
    <h2 class="text-2xl font-semibold mb-4">Restablecer contraseña</h2>
    <div class="card bg-base-100 border border-base-600 mt-6">
      <div class="card-body">
        <div v-if="successMessage" class="text-green-600 mb-4">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="text-red-600 mb-4">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleResetPassword" v-if="!successMessage">
          <label class="block mb-2 font-medium">Nueva contraseña</label>
          <input
            type="password"
            v-model="password"
            class="w-full border px-3 py-2 rounded mb-4"
            required
          />

          <label class="block mb-2 font-medium">Confirmar contraseña</label>
          <input
            type="password"
            v-model="confirmPassword"
            class="w-full border px-3 py-2 rounded mb-4"
            required
          />

          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full mt-4"
          >
            Guardar nueva contraseña
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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

const route = useRoute();
const router = useRouter();

const password = ref('');
const confirmPassword = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const oobCode = ref('');
const email = ref('');
const uid = ref('');

onMounted(async () => {
  oobCode.value = route.query.oobCode;
  if (!oobCode.value) {
    errorMessage.value = 'Código inválido o expirado.';
    return;
  }

  try {
    // Verificar el código y obtener el email
    email.value = await verifyPasswordResetCode(auth, oobCode.value);
  } catch (error) {
    errorMessage.value = 'El enlace de restablecimiento no es válido o ha expirado.';
  }
});

const validatePasswords = () => {
  // Valida que la contraseña tenga al menos 6 caracteres
  if (password.value.length < 6) {
    errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
  } else if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.';
  } else {
    errorMessage.value = '';
  }
};

const handleResetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.';
    return;
  }
  validatePasswords();
  if (errorMessage.value) {
    return;
  }

  try {
    await confirmPasswordReset(auth, oobCode.value, password.value);

    // Buscar documento en 'spectators' por email
    const q = query(collection(db, 'spectators'), where('email', '==', email.value));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      uid.value = docSnap.id;

      const data = docSnap.data();

      // ✅ Solo actualizar si no está ya en true
      if (!data.passwordChanged) {
        const userRef = doc(db, 'spectators', uid.value);
        await updateDoc(userRef, {
          passwordChanged: true,
        });
      }
    }

    successMessage.value = '¡Contraseña actualizada con éxito!';
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    errorMessage.value = 'Error al actualizar la contraseña. Intenta nuevamente.';
  }
};
</script>


