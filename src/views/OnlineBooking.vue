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

          <button
            type="submit"
            class="btn-md btn btn-primary text-white w-full mt-4"
          >
            <span v-if="!isLoading">Registrarme y entrar</span>
            <span v-else class="loading loading-dots loading-sm"></span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de que tienes tu instancia de Firestore
import { useRouter } from 'vue-router';


const email = ref('');
const name = ref('');
const lastName = ref('');
const phone = ref('+56');
const numberOfPeople = ref(1);
const isChecked = ref(false);
const isCheckinActive = ref(false);
const uniquePaymentForGroup = ref(true);
const subscribedEventsId = ref('4Ms88Hw9i3okcTHI7AV6');

const emailError = ref('');
const phoneError = ref('');

const isLoading = ref(false);

const router = useRouter();

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
      const spectatorData = {
        email: email.value,
        name: name.value,
        phone: phone.value,
        numberOfPeople: numberOfPeople.value,
        isChecked: isChecked.value,
        isCheckinActive: isCheckinActive.value,
        uniquePaymentForGroup: uniquePaymentForGroup.value,
        subscribedEventsId: subscribedEventsId.value.split(',').map(id => id.trim()),
      };

      // Guardar documento y obtener su ID
      const docRef = await addDoc(collection(db, 'spectators'), spectatorData);

      // Redirigir a la ruta /profile/{documentId}
      router.push(`/profile/${docRef.id}`);
    } catch (error) {
      console.error('Error guardando el espectador: ', error);
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
