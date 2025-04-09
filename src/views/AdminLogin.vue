<template>
  <div>
    <h1>Iniciar sesión como Admin</h1>
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
        <span>Login</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router'; // Importar el router para redirigir

const email = ref('');
const password = ref('');
const router = useRouter(); // Crear una instancia del router

const login = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    console.log('Usuario logueado:', userCredential.user);
    router.push('/admin'); // Redirigir a la ruta /admin después del login exitoso
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
  }
};
</script>
