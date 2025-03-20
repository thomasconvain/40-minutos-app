<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="router.push({name:'Home'})">Volver</button>
    <div class="flex flex-col items-center mb-10">
      <img src="../assets/logo.png" width="150">
    </div>
    <!-- <h1 class="text-lg mb-4">Ingresa con el número de teléfono que indicaste para obtener tus tickets</h1>
    <div>
      <div class="mt-1 flex rounded-md shadow-sm">
        <input
          v-model="phone"
          @input="validatePhone"
          type="tel"
          name="phone-number"
          id="phone-number"
          class="input-md grow block w-full px-3 py-2 rounded-md focus:ring-gray-500 focus:border-gray-500 sm:text-sm border-gray-300"
          placeholder="" />
      </div>
    </div>
    <p v-if="phoneError" class="text-red-500 text-sm">{{ phoneError }}</p> -->

    <form @submit.prevent="login">
      <div class="flex flex-col mt-4">
        <label class="text-sm" for="name"><strong>Email</strong></label>
        <input v-model="email" type="email" placeholder="Email" class="input input-bordered w-full w-full" required />
      </div>
      <div class="flex flex-col mt-4">
        <label class="text-sm" for="name"><strong>Contraseña</strong></label>
        <input v-model="password" type="password" placeholder="Contraseña" class="input input-bordered w-full w-full" required />
      </div>
      <button
        type="submit"
        class="btn-md btn btn-primary text-white w-full mt-4"
      >
        <span>Entrar</span>
      </button>
    </form>
    <button
        @click="router.push({name:'Booking', params: { idEvent: eventId }})"
        type="submit"
        class="btn-md btn btn-primary btn-outline text-white w-full mt-4"
      >
        <span>Aún no tengo cuenta</span>
      </button>
    <button
        @click="router.push({name:'PasswordReset'})"
        class="btn-md btn btn-link btn-primary text-black w-full mt-4"
      >
        <span>Olvidé contraseña</span>
      </button>

    <!-- <div class="flex flex-col items-center">
      <button
        type="button"
        :disabled="isButtonDisabled"
        class="btn-md mt-2 inline-flex justify-center w-full items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="checkSpectatorSubscriptions"
      >
        <span>Entrar</span>
      </button>
    </div> -->
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';


// Variables reactivas
// const phone = ref('+56');
// const phoneError = ref('');
// const isButtonDisabled = ref(true);
const email = ref('');
const password = ref('');
const router = useRouter(); // Importar el enrutador
const route = useRoute();

const eventId = route.params.idEvent;

// // Función para validar el número de teléfono
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
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const db = getFirestore();
    const spectatorsRef = collection(db, 'spectators');
    const q = query(spectatorsRef, where('email', '==', email.value));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      console.log('Usuario logueado:', userCredential.user);
      router.push({ name: 'Profile', params: { idSpectator: doc.id } });
    } else {
      alert('Usuario no encontrado.');
    }
  } catch (error) {
    alert('El usuario no existe o la contraseña está incorrecta.', error.message);
  }
};
</script>