<template>
  <div class="reservation-container">
    <!-- Cabecera con título y botón volver -->
    <div class="flex justify-between items-center mt-8">
      <h1 class="card-title">Evento privado</h1>
      <button 
        class="btn bg-white border-none" 
        @click="$router.go(-1)"
      >
        Volver
      </button>
    </div>
    
    <!-- Información del evento si existe -->
    <!-- <div v-if="eventData" class="bg-gray-50 p-4 rounded-lg mb-6">
      <h2 class="text-lg font-semibold">{{ eventData.name }}</h2>
      <p class="text-sm text-gray-600">{{ formatEventDate(eventData.date) }}</p>
    </div> -->
    
    <!-- Formulario de verificación -->
    <div class="form-group mt-6 mb-6">
      <!-- <h3 class="text-lg font-bold mb-4">Verifica tu inscripción</h3> -->
      <p class="text-sm text-gray-600 mb-4">
        Ingresa tu teléfono para verificar si ya estás inscrito en este evento
      </p>
      
      <label class="text-sm font-bold" for="phone">Teléfono</label>
      <input 
        v-model="phone" 
        type="tel" 
        id="phone" 
        placeholder="+56 9 1234 5678" 
        class="input input-bordered w-full mt-2" 
        :class="{ 'input-error': phoneError }"
        @blur="validatePhone"
        required 
      />
      <p v-if="phoneError" class="text-error text-xs mt-1">{{ phoneError }}</p>
      
      <button
        @click="verifyPhoneInEvent"
        type="button"
        class="btn-md btn btn-primary text-white w-full mt-4"
        :disabled="isLoading || !phone"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
        <span v-else>Verificar inscripción</span>
      </button>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '@/firebase';

const route = useRoute();
const router = useRouter();

const phone = ref('+56 ');
const phoneError = ref('');
const eventData = ref(null);
const isLoading = ref(false);
const invitationCode = route.params.invitationCode || route.query.code;

onMounted(async () => {
  if (invitationCode) {
    await fetchEventByCode(invitationCode);
  }
});

const fetchEventByCode = async (code) => {
  try {
    isLoading.value = true;
    const eventsCollection = collection(db, "events");
    const q = query(eventsCollection, where("settings.invitationCode", "==", code));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const eventDoc = querySnapshot.docs[0];
      eventData.value = {
        id: eventDoc.id,
        ...eventDoc.data()
      };
    }
  } catch (error) {
    console.error("Error fetching event:", error);
  } finally {
    isLoading.value = false;
  }
};

const validatePhone = () => {
  const phonePattern = /^\+56\d{9}$/;
  phoneError.value = phonePattern.test(phone.value)
    ? ''
    : 'Por favor ingresa un número de teléfono válido en formato +56XXXXXXXXX (sin espacios)';
  return phoneError.value === '';
};

const verifyPhoneInEvent = async () => {
  if (!validatePhone() || !eventData.value) return;
  
  try {
    isLoading.value = true;
    
    // Obtener todos los spectatorIds del evento
    const zSpectator = eventData.value.zSpectator || [];
    const spectatorIds = zSpectator
      .map(spec => spec.spectatorId)
      .filter(id => id && typeof id === 'string');
    
    if (spectatorIds.length === 0) {
      // No hay espectadores en el evento, redirigir a booking
      router.push({ 
        name: 'Booking', 
        params: { idEvent: eventData.value.id },
        query: { phone: phone.value }
      });
      return;
    }
    
    // Buscar en la colección spectators por teléfono
    const spectatorsRef = collection(db, 'spectators');
    const q = query(spectatorsRef, where('phone', '==', phone.value));
    const querySnapshot = await getDocs(q);
    
    let foundSpectator = null;
    querySnapshot.forEach((doc) => {
      const spectatorData = doc.data();
      // Verificar si este spectator está en el evento actual
      if (spectatorIds.includes(doc.id)) {
        foundSpectator = { id: doc.id, ...spectatorData };
      }
    });
    
    if (foundSpectator) {
      // Ya está inscrito, autenticar de forma anónima y redirigir a SpectatorProfile
      console.log('🔍 Found spectator, authenticating anonymously and redirecting to Profile with idSpectator:', foundSpectator.id);
      try {
        await signInAnonymously(auth);
        console.log('✅ Anonymous authentication successful');
        router.push({ name: 'Profile', params: { idSpectator: foundSpectator.id } });
      } catch (authError) {
        console.error('❌ Error with anonymous authentication:', authError);
        window.alert('Error de autenticación. Inténtalo de nuevo.');
      }
    } else {
      // No está inscrito, redirigir a booking con teléfono pre-llenado
      router.push({ 
        name: 'Booking', 
        params: { idEvent: eventData.value.id },
        query: { phone: phone.value }
      });
    }
  } catch (error) {
    console.error("Error verificando teléfono:", error);
    window.alert("Error al verificar el teléfono");
  } finally {
    isLoading.value = false;
  }
};


// const formatEventDate = (timestamp) => {
//   if (!timestamp || typeof timestamp.toDate !== 'function') {
//     return "Fecha no disponible";
//   }
  
//   try {
//     const date = timestamp.toDate();
//     return date.toLocaleDateString('es-ES', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   } catch (error) {
//     return "Fecha no disponible";
//   }
// };
// </script>

<style scoped>
.reservation-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.form-group {
  margin-bottom: 1rem;
}
</style>