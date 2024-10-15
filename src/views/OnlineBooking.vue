<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="router.push({name:'Home'})">Volver</button>
    <div class="card bg-base-100 border border-base-600 mt-6">
      <div class="card-body">
        <h2 class="card-title">Ingresa tus datos</h2>
        <form @submit.prevent="submitForm">
          <div class="flex flex-col">
          <label class="text-sm" for="email"><strong>Email</strong></label>
            <input v-model="email" type="string" id="email" class="input input-bordered w-full w-full" required />
            <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="name"><strong>Nombre</strong></label>
            <input v-model="name" type="text" id="name" class="input input-bordered w-full w-full" required />
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="name"><strong>Apellidos</strong></label>
            <input v-model="lastName" type="text" id="name" class="input input-bordered w-full w-full" required />
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="phone"><strong>Teléfono</strong></label>
            <input v-model="phone" type="text" id="phone" class="input input-bordered w-full w-full" required />
            <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
          </div>

          <div class="flex flex-col mt-4">
            <label class="text-sm" for="phone"><strong>Contraseña</strong></label>
            <input v-model="password" type="password" id="password" class="input input-bordered w-full w-full" required />
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de que tienes tu instancia de Firestore
import { useRouter, useRoute } from 'vue-router';


const email = ref('');
const name = ref('');
const lastName = ref('');
const phone = ref('+56');
const password = ref();
const numberOfPeople = ref(1);
const isChecked = ref(false);
const uniquePaymentForGroup = ref(true);

const emailError = ref('');
const phoneError = ref('');
const errorMessage = ref('')

const isLoading = ref(false);

const auth = getAuth();
const router = useRouter();
const route = useRoute();

const checkExistingPhoneNumber = async () => {
  const q = query(collection(db, 'spectators'), where('phone', '==', phone.value));
  const querySnapshot = await getDocs(q);

  // Si el query devuelve algún documento, significa que el número de teléfono ya existe
  if (!querySnapshot.empty) {
    phoneError.value = 'El número de teléfono ya está en uso';
    isLoading.value = false;
    return false;
  }

  phoneError.value = '';
  return true;
};

const submitForm = async () => {
  isLoading.value = true;
  validateFormat();
  if (emailError.value === '' && phoneError.value === '') {
    const isPhoneAvailable = await checkExistingPhoneNumber();

    // Si el número de teléfono ya está en uso, detener la ejecución
    if (!isPhoneAvailable) {
      return;
    }

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
        numberOfPeople: numberOfPeople.value,
        isChecked: isChecked.value,
        uniquePaymentForGroup: uniquePaymentForGroup.value,
        subscribedEventsId: route.params.idEvent.split(',').map(id => id.trim()),
      };

      // Guardar documento y obtener su ID
      await setDoc(doc(db, 'spectators', user.uid), spectatorData);

      // Redirigir a la ruta /profile/{documentId}
      router.push(`/profile/${user.uid}`);
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

// Validación del email
const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value)) {
    emailError.value = 'Por favor ingresa un correo válido.';
  } else {
    emailError.value = '';
  }
};

const validatePhone = () => {
  const phonePattern = /^\+56\d{9}$/; // Formato para números de teléfono en Chile: +56XXXXXXXXX
  if (!phonePattern.test(phone.value)) {
    phoneError.value = 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX.';
  } else {
    phoneError.value = '';
  }
};

const validateFormat = () => {
  validateEmail();
  validatePhone();
}
</script>
