<template>
  <div class="reservation-container">
    <!-- Cabecera con título y botón volver -->
    <div class="flex justify-between items-center mt-8">
      <!-- <h1 class="card-title">Reserva tu cupo</h1> -->
      <button 
        class="btn bg-white border-none" 
        @click="showForm ? showForm = false : $router.go(-1)"
      >
        Volver
      </button>
    </div>
    
    <!-- Selector de número de personas - siempre visible -->
    <div class="form-group mt-2 mb-6">
      <label class="text-sm font-bold" for="numberOfPeople">¿Cuántas personas te acompañan?</label>
      <input 
        v-model="numberOfPeople" 
        type="number" 
        min="1" 
        placeholder="Ingresa el número total de participantes" 
        id="numberOfPeople" 
        class="input input-bordered w-full" 
        required 
      />
      <p v-if="numberOfPeople >= 2" class="text-yellow-600 text-sm mt-1">Se recomienda ir con niños mayores de 10 años</p>
    </div>
    
    <!-- Opciones iniciales -->
    <div v-if="!showForm" class="options-container">
      <!-- Opción para nuevos usuarios -->
      <div class="option-group mb-2">
        <button
          @click="showForm = true"
          type="button"
          class="btn-md btn btn-primary text-white w-full"
          :disabled="isLoading"
        >
          <span>Continuar</span>
        </button>
      </div>
      
    </div>
    
    <!-- Formulario completo -->
    <form v-if="showForm" @submit.prevent="submitForm" class="reservation-form mt-4">
      <!-- Campos personales -->
      <div class="form-group mt-2" >
        <label class="text-sm font-bold" for="name">Nombre</label>
        <input 
          v-model="name" 
          type="text" 
          id="name" 
          class="input input-bordered w-full" 
          required 
        />
      </div>

      <div class="form-group mt-2">
        <label class="text-sm font-bold" for="lastName">Apellidos</label>
        <input 
          v-model="lastName" 
          type="text" 
          id="lastName" 
          class="input input-bordered w-full" 
          required 
        />
      </div>

      <div class="form-group mt-2">
        <label class="text-sm font-bold" for="email">Email</label>
        <input 
          v-model="email" 
          type="email" 
          id="email" 
          class="input input-bordered w-full" 
          required 
          @blur="validateEmail"
        />
        <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
      </div>

      <div class="form-group mt-2">
        <label class="text-sm font-bold" for="phone">Teléfono</label>
        <input 
          v-model="phone" 
          type="tel" 
          id="phone" 
          class="input input-bordered w-full" 
          required 
          @blur="validatePhone"
        />
        <p v-if="phoneError" class="text-red-500 text-sm mt-1">{{ phoneError }}</p>
      </div>

      <!-- Botón de envío -->
      <button
        type="submit"
        class="btn-md btn btn-primary text-white w-full mt-6"
        :disabled="isLoading"
      >
        <span v-if="isLoading">Procesando...</span>
        <span v-else>Reservar</span>
      </button>
      
      <!-- Mensaje de error general -->
      <p v-if="errorMessage" class="text-red-500 text-center mt-4">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter, useRoute } from 'vue-router';
import { addSpectatorToEvent } from '@/utils';

// Router y auth
const auth = getAuth();
const router = useRouter();
const route = useRoute();

// Estado del formulario
const showForm = ref(false);
const isLoading = ref(false);

// Campos del formulario
const numberOfPeople = ref(1);
const name = ref('');
const lastName = ref('');
const email = ref('');
const phone = ref('+56');
const password = ref('');
const confirmPassword = ref('');

// Valores calculados
const numberOfCompanions = computed(() => 
  numberOfPeople.value === 1 ? 0 : (numberOfPeople.value - 1)
);

// Configuración adicional
const isChecked = ref(false);
const uniquePaymentForGroup = ref(true);

// Mensajes de error
const emailError = ref('');
const phoneError = ref('');
const confirmPasswordError = ref('');
const errorMessage = ref('');

// Inicialización
onMounted(() => {
  password.value = route.params.idEvent;
  confirmPassword.value = route.params.idEvent;
  
  // Pre-llenar teléfono si viene desde verificación de evento privado
  if (route.query.phone) {
    phone.value = route.query.phone;
  }
});

// Validaciones
const validateEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailError.value = emailPattern.test(email.value)
    ? ''
    : 'Por favor ingresa un correo válido.';
  return emailError.value === '';
};

const validatePhone = () => {
  const phonePattern = /^\+56\d{9}$/;
  phoneError.value = phonePattern.test(phone.value)
    ? ''
    : 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX (sin espacios).';
  return phoneError.value === '';
};

const validatePasswords = () => {
  if (password.value.length < 6) {
    confirmPasswordError.value = 'La contraseña debe tener al menos 6 caracteres.';
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Las contraseñas no coinciden.';
  } else {
    confirmPasswordError.value = '';
  }
  return confirmPasswordError.value === '';
};

const validateForm = () => {
  const isEmailValid = validateEmail();
  const isPhoneValid = validatePhone();
  const isPasswordValid = validatePasswords();
  return isEmailValid && isPhoneValid && isPasswordValid;
};


// Función para verificar si isCheckInOpen está activo en el evento
const checkEventStatus = async (eventId) => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      return eventDoc.data().status?.isCheckInOpen || false;
    }
    return false;
  } catch (error) {
    console.error('Error al verificar el estado del evento:', error);
    return false;
  }
};

// Función para verificar si un teléfono ya está inscrito en un evento
const checkPhoneInEventSpectators = async (phone, eventId) => {
  try {
    console.log('🔍 checkPhoneInEventSpectators - phone:', phone, 'eventId:', eventId);
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      const zSpectator = eventData.zSpectator || [];
      
      // Buscar directamente por teléfono en zSpectator
      const spectatorByPhone = zSpectator.find(spec => spec.phone === phone);
      
      if (spectatorByPhone) {
        console.log('🔍 Encontrado spectator por teléfono:', spectatorByPhone);
        return spectatorByPhone;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking phone in event spectators:', error);
    return false;
  }
};

// Función para verificar si un email ya está inscrito en un evento (revisando spectators de zSpectator)
const checkEmailInEventSpectators = async (email, eventId) => {
  try {
    console.log('🔍 checkEmailInEventSpectators - email:', email, 'eventId:', eventId);
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      const zSpectator = eventData.zSpectator || [];
      console.log('🔍 zSpectator:', zSpectator);
      
      // Obtener todos los spectatorIds de zSpectator
      const spectatorIds = zSpectator
        .map(spec => {
          console.log('🔍 spec:', spec);
          return spec?.spectatorId || spec?.id;
        })
        .filter(id => {
          console.log('🔍 filtering id:', id, typeof id);
          return id && typeof id === 'string';
        });
      
      console.log('🔍 spectatorIds después del filtro:', spectatorIds);
      
      if (spectatorIds.length === 0) {
        console.log('🔍 No hay spectatorIds, retornando false');
        return false;
      }
      
      // Filtrar esos IDs en la colección spectators y verificar emails
      const spectatorsRef = collection(db, 'spectators');
      const spectatorPromises = spectatorIds.map(id => {
        console.log('🔍 Buscando spectator con id:', id);
        return getDoc(doc(spectatorsRef, id));
      });
      const spectatorDocs = await Promise.all(spectatorPromises);
      
      // Revisar si existe ese email en alguno de los spectators inscritos
      return spectatorDocs.some(doc => {
        if (doc.exists()) {
          const spectatorData = doc.data();
          console.log('🔍 Comparando email:', spectatorData.email, 'con:', email);
          return spectatorData.email === email;
        }
        return false;
      });
    }
    return false;
  } catch (error) {
    console.error('❌ Error al verificar el email en el evento:', error);
    return false;
  }
};

// Función para buscar usuario existente por email en la colección spectators
const findExistingSpectatorByEmail = async (email) => {
  try {
    console.log('🔍 findExistingSpectatorByEmail - email:', email);
    const spectatorsRef = collection(db, 'spectators');
    const q = query(spectatorsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const result = { id: doc.id, ...doc.data() };
      console.log('🔍 Usuario encontrado:', result);
      return result;
    }
    console.log('🔍 Usuario no encontrado');
    return null;
  } catch (error) {
    console.error('❌ Error al buscar espectador por email:', error);
    return null;
  }
};

const submitForm = async () => {
  try {
    isLoading.value = true;
    
    if (!validateForm()) {
      return;
    }
    
    let user;
    let spectatorData;
    let isNewUser = false;
    
    // Verificar si el email ya está inscrito en este evento
    const eventId = route.params.idEvent?.split(',')[0].trim();
    
    if (!eventId) {
      errorMessage.value = 'ID de evento no válido.';
      return;
    }
    
    // Si viene con teléfono prellenado desde PrivateEventAccess, verificar por teléfono
    if (route.query.phone) {
      const phoneAlreadyInEvent = await checkPhoneInEventSpectators(phone.value, eventId);
      if (phoneAlreadyInEvent) {
        // Redirigir directamente al perfil del espectador en lugar de mostrar error
        router.push({ name: 'Profile', params: { idSpectator: phoneAlreadyInEvent.spectatorId } });
        return;
      }
    } else {
      // Verificación normal por email
      const emailAlreadyInEvent = await checkEmailInEventSpectators(email.value, eventId);
      
      if (emailAlreadyInEvent) {
        errorMessage.value = 'Ya tienes una reserva activa para este evento.';
        return;
      }
    }
    
    // Verificar si existe un espectador con este email
    const existingSpectator = await findExistingSpectatorByEmail(email.value);
    
    if (existingSpectator) {
      // Usuario existe en la colección spectators pero no está inscrito en este evento
      user = { uid: existingSpectator.uId || existingSpectator.id };
      spectatorData = existingSpectator;
      isNewUser = false;
    } else {
      // Usuario no existe en spectators, intentar crear en Authentication
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        user = userCredential.user;
        isNewUser = true;
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // Email existe en Authentication pero no en spectators
          // Esto podría pasar si el documento de spectator fue eliminado
          errorMessage.value = 'Este email ya está registrado. Si tienes problemas para acceder, contacta soporte.';
          return;
        } else {
          throw error;
        }
      }
    }
    
    // Preparar y actualizar datos para Firestore
    if (isNewUser) {
      // Si es un usuario nuevo, crear el documento completo
      spectatorData = {
        email: email.value,
        uId: user.uid,
        hostId: route.query.hostId ? route.query.hostId : 'none',
        name: name.value,
        lastName: lastName.value,
        phone: phone.value,
        numberOfPeople: numberOfPeople.value,
        numberOfCompanions: numberOfCompanions.value,
        isChecked: isChecked.value,
        uniquePaymentForGroup: uniquePaymentForGroup.value,
        subscribedEventsId: route.params.idEvent?.split(',').map(id => id.trim()) || [],
      };
      
      // Guardar en Firestore
      await setDoc(doc(db, 'spectators', user.uid), spectatorData);
    } else {
      // Si es un usuario existente, actualizar solo los eventos suscritos
      const currentEvents = spectatorData.subscribedEventsId || [];
      const newEvents = route.params.idEvent?.split(',').map(id => id.trim()) || [];
      
      // Combinar eventos existentes con nuevos eventos (sin duplicados)
      const updatedEvents = [...new Set([...currentEvents, ...newEvents])];
      
      // Actualizar el documento
      await setDoc(doc(db, 'spectators', user.uid), {
        ...spectatorData,
        subscribedEventsId: updatedEvents,
        // Actualizar datos del formulario por si han cambiado
        numberOfPeople: numberOfPeople.value,
        numberOfCompanions: numberOfCompanions.value,
      }, { merge: true });
      
      spectatorData = { ...spectatorData, subscribedEventsId: updatedEvents };
    }
    
    // Para cada evento al que se suscribe, añadir el espectador al evento
    const eventIds = route.params.idEvent?.split(',').map(id => id.trim()) || [];
    for (const eventId of eventIds) {
      // Solo guardar en zSpectator los datos mínimos requeridos según el nuevo modelo
      // Incluir nameComplete solo en zSpectator, no en el documento de espectadores
      const spectatorForEvent = {
        id: user.uid,
        numberOfCompanions: numberOfCompanions.value,
        nameComplete: isNewUser ? 
          `${name.value} ${lastName.value}`.trim() : 
          `${spectatorData.name} ${spectatorData.lastName}`.trim()
      };
      
      // Añadir espectador al evento (ahora solo actualiza zSpectator)
      await addSpectatorToEvent(eventId, spectatorForEvent);
    }
    
    console.log('✅ Proceso completado, redirigiendo a confirmación con user.uid:', user.uid);
    
    // Si viene desde PrivateEventAccess (con teléfono prellenado), siempre redirigir a Profile
    if (route.query.phone) {
      console.log('📍 Viene desde PrivateEventAccess, redirigiendo a Profile con autenticación anónima');
      try {
        // Importar signInAnonymously dinámicamente
        const { signInAnonymously } = await import('firebase/auth');
        const { auth } = await import('@/firebase');
        
        await signInAnonymously(auth);
        console.log('✅ Anonymous authentication successful');
        
        router.push({ 
          name: 'Profile', 
          params: { idSpectator: user.uid }
        });
      } catch (authError) {
        console.error('❌ Error with anonymous authentication:', authError);
        // Fallback al flujo normal si falla la autenticación
        router.push({ 
          name: 'Reserve', 
          params: { idSpectator: user.uid }, 
          query: { 
            idEvent: route.params.idEvent || ''
          } 
        });
      }
    } else {
      // Flujo normal: verificar si el check-in está abierto para determinar la redirección
      const firstEventId = route.params.idEvent?.split(',')[0].trim(); // Usar el primer evento
      const isCheckInOpen = await checkEventStatus(firstEventId);
      
      console.log('🔍 Check-in abierto:', isCheckInOpen);
      
      if (isCheckInOpen) {
        // Si el check-in está abierto, redirigir directamente al perfil
        console.log('📍 Redirigiendo a Profile');
        router.push({ 
          name: 'Profile', 
          params: { idSpectator: user.uid }
        });
      } else {
        // Si el check-in no está abierto, ir a la página de confirmación
        console.log('📍 Redirigiendo a Reserve');
        router.push({ 
          name: 'Reserve', 
          params: { idSpectator: user.uid }, 
          query: { 
            idEvent: route.params.idEvent || ''
          } 
        });
      }
    }
  } catch (error) {
    console.error('Error en el proceso de reserva:', error);
    errorMessage.value = 'Error al procesar la reserva: ' + error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.reservation-container {
  max-width: 100%;
}
</style>