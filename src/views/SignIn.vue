<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="router.push({name:'Home'})">Volver</button>
    <div class="card bg-base-100 border border-base-600 mt-6">
      <div class="card-body">
        <h1 class="card-title mt-8">
          Crear una cuenta <br/>
        </h1>
        <form @submit.prevent="submitForm">
          <div class="flex flex-col mt-4">
            <label class="text-sm" for="email"><strong>Email</strong></label>
            <input v-model="email" type="string" id="email" class="input input-bordered w-full" required />
            <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="name"><strong>Nombre</strong></label>
            <input v-model="name" type="text" id="name" class="input input-bordered w-full" required />
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="lastName"><strong>Apellidos</strong></label>
            <input v-model="lastName" type="text" id="lastName" class="input input-bordered w-full" required />
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="phone"><strong>Teléfono</strong></label>
            <input v-model="phone" type="text" id="phone" class="input input-bordered w-full" required />
            <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="password"><strong>Contraseña</strong></label>
            <input v-model="password" type="password" id="password" class="input input-bordered w-full" required />
          </div>

          <!-- Campo para confirmar la contraseña -->
          <div class="flex flex-col mt-4">
            <label class="text-sm" for="confirmPassword"><strong>Confirmar Contraseña</strong></label>
            <input v-model="confirmPassword" type="password" id="confirmPassword" class="input input-bordered w-full" required />
            <p v-if="confirmPasswordError" class="text-red-500 text-sm mt-1">{{ confirmPasswordError }}</p>
          </div>

          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full mt-4"
          >
            <span v-if="!isLoading">Registrarme y entrar</span>
            <span v-else class="loading loading-dots loading-sm"></span>
          </button>
          <p v-if="errorMessage" class="text-red-500 text-sm mt-1">{{ errorMessage }}</p>
        </form>
        <button
            @click="router.push({name:'LogIn', params: { idEvent: route.params.idEvent }})"
            type="submit"
            class="btn-md btn btn-link text-black w-full mt-2"
          >
            <span>Ingresa acá si ya tienes una cuenta</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter, useRoute } from 'vue-router';

const email = ref('');
const name = ref('');
const lastName = ref('');
const phone = ref('+56');
const password = ref('');
const confirmPassword = ref(''); // Campo para confirmar contraseña
const isChecked = ref(false);
const uniquePaymentForGroup = ref(true);

const emailError = ref('');
const phoneError = ref('');
const confirmPasswordError = ref(''); // Para errores de contraseña
const errorMessage = ref('');

const isLoading = ref(false);

const auth = getAuth();
const router = useRouter();
const route = useRoute();

const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailError.value = emailPattern.test(email.value)
    ? ''
    : 'Por favor ingresa un correo válido.';
};

const validatePhone = () => {
  const phonePattern = /^\+56\d{9}$/; // Formato para +56XXXXXXXXX
  phoneError.value = phonePattern.test(phone.value)
    ? ''
    : 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX.';
};

const validatePasswords = () => {
  // Valida que la contraseña tenga al menos 6 caracteres
  if (password.value.length < 6) {
    confirmPasswordError.value = 'La contraseña debe tener al menos 6 caracteres.';
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Las contraseñas no coinciden.';
  } else {
    confirmPasswordError.value = '';
  }
};

const validateFormat = () => {
  validateEmail();
  validatePhone();
  validatePasswords();
};

const submitForm = async () => {
  isLoading.value = true;
  validateFormat();
  if (emailError.value === "test@test.cl") {
    isLoading.value = false;
    return
  }


  // Verificar que no existan errores
  if (emailError.value === '' && phoneError.value === '' && confirmPasswordError.value === '') {
    try {
      // Crear el usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      const user = userCredential.user;
      const spectatorData = {
        email: email.value,
        uId: user.uid,
        hostId: route.query.hostId ? route.query.hostId : 'none',
        name: name.value,
        phone: phone.value,
        isChecked: isChecked.value,
        uniquePaymentForGroup: uniquePaymentForGroup.value,
        passwordChanged: true,
        subscribedEventsId: route.params.idEvent
          ? route.params.idEvent.split(',').map(id => id.trim())
          : [],
      };

      // Guardar documento en Firestore
      await setDoc(doc(db, 'spectators', user.uid), spectatorData);

      // Redirigir a la ruta /profile/{user.uid}
      router.push({ name: 'Profile', params: { idSpectator: user.uid }, query: { idEvent: route.params.idEvent } });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        emailError.value = 'El email ya está en uso. Por favor, elige otro o intenta iniciar sesión.';
      } else {
        errorMessage.value = 'Error al crear usuario: ' + error.message;
      }
    }
  }
  isLoading.value = false;
};
</script>
