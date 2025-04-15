<template>
  <div>
    <button class="btn bg-white border-none mb-4" @click="router.push({name:'Home'})">Volver</button>
    <div class="flex flex-col items-center mb-10">
      <img src="../assets/logo_horizontal.png" width="150">
    </div>

    <form @submit.prevent="login">
      <div class="form-group mb-4">
        <label class="block text-sm font-medium mb-2" for="email"><strong>Email</strong></label>
        <input 
          id="email"
          v-model="email" 
          type="email" 
          placeholder="Email" 
          class="input input-bordered w-full" 
          required 
        />
      </div>
      
      <PasswordField
        v-model="password"
        id="login-password"
        label="Contraseña"
        placeholder="Contraseña"
        class="mb-4"
        :error="passwordError"
      />
      
      <button
        type="submit"
        class="btn-md btn btn-primary text-white w-full mt-4"
        :disabled="isLoading"
      >
        <span v-if="!isLoading">Entrar</span>
        <span v-else class="loading loading-dots loading-sm"></span>
      </button>
      
      <!-- Mensaje de error -->
      <div v-if="errorMessage" class="alert alert-error mt-4">
        {{ errorMessage }}
      </div>
    </form>
    
    <button
      @click="router.push({name:'PasswordReset'})"
      class="btn-md btn btn-link btn-primary text-black w-full mt-4"
    >
      <span>Recuperar contraseña</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import PasswordField from '@/components/PasswordField.vue';
import { addSpectatorToEvent } from '@/utils';

// Estado del formulario
const email = ref('');
const password = ref('');
const passwordError = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// Router y route
const router = useRouter();
const route = useRoute();

const eventId = route.params.idEvent;

const login = async () => {
  // Evitar múltiples envíos
  if (isLoading.value) return;
  
  // Resetear errores
  passwordError.value = '';
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    // Intentar inicio de sesión
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    
    // Buscar datos del espectador
    const db = getFirestore();
    const spectatorsRef = collection(db, 'spectators');
    const q = query(spectatorsRef, where('email', '==', email.value));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      const spectatorData = docData.data();
      console.log('Usuario logueado:', userCredential.user);
      
      // Si hay un eventId en los parámetros de la ruta y el usuario viene de una reserva
      if (eventId) {
        // Obtener el número de personas de la consulta, si existe
        const numberOfPeople = route.query.numberOfPeople ? parseInt(route.query.numberOfPeople) : 1;
        const numberOfCompanions = numberOfPeople > 1 ? numberOfPeople - 1 : 0;
        
        // Verificar si necesitamos actualizar el evento con los datos del espectador
        const eventIds = eventId.split(',').map(id => id.trim());
        
        for (const currentEventId of eventIds) {
          // Añadir el espectador al evento si no está ya incluido
          const spectatorForEvent = {
            id: docData.id,
            name: spectatorData.name || '',
            lastName: spectatorData.lastName || '',
            numberOfCompanions: numberOfCompanions,
            email: spectatorData.email || '',
            phone: spectatorData.phone || '',
          };
          
          // Añadir el espectador al evento
          await addSpectatorToEvent(currentEventId, spectatorForEvent);
          
          // Actualizar o añadir el evento a la lista de eventos suscritos del espectador si no está ya
          if (!spectatorData.subscribedEventsId || !spectatorData.subscribedEventsId.includes(currentEventId)) {
            const spectatorRef = doc(db, 'spectators', docData.id);
            await updateDoc(spectatorRef, {
              subscribedEventsId: arrayUnion(currentEventId),
              // Actualizar numberOfCompanions si es necesario
              numberOfCompanions: numberOfCompanions
            });
          }
        }
      }
      
      // Redirigir al perfil con parámetros adicionales
      router.push({ 
        name: 'Profile', 
        params: { idSpectator: docData.id }, 
        query: { 
          idEvent: eventId, 
          from: 'login',
          // Pasar el número de personas si existe en la consulta
          ...(route.query.numberOfPeople && { numberOfPeople: route.query.numberOfPeople })
        } 
      });
    } else {
      errorMessage.value = 'Usuario no encontrado en el sistema.';
    }
  } catch (error) {
    console.error('Error de inicio de sesión:', error);
    
    // Manejar diferentes errores de autenticación
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      passwordError.value = 'Contraseña incorrecta.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage.value = 'No existe una cuenta con este correo electrónico.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage.value = 'El formato del correo electrónico no es válido.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage.value = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
    } else {
      errorMessage.value = 'Error al iniciar sesión: ' + (error.message || 'Error desconocido');
    }
  } finally {
    isLoading.value = false;
  }
};
</script>