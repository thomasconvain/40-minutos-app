<template>
  <div v-if="bankAccount" class="w-full">
    <div class="overflow-x-auto flex flex-col mt-4">
      <div v-if="bankAccount?.name && bankAccount?.id && bankAccount?.bank" class="flex flex-col items-end w-full">
        <button class="btn btn-sm max-w-40 mr-0" @click="copyToClipboard"><DocumentDuplicateIcon class="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />Copiar datos </button>
        <p class="text-sm text-gray-600">{{ copiedMessage }}</p>
      </div>
      <table class="table">
        <tbody>
          <!-- row 1 -->
          <tr>
            <td>Nombre</td>
            <td>{{ bankAccount?.name || 'No disponible' }}</td>
          </tr>
          <!-- row 2 -->
          <tr>
            <td>RUT</td>
            <td>{{ bankAccount?.id || 'No disponible' }}</td>
          </tr>
          <!-- row 3 -->
          <tr>
            <td>Banco</td>
            <td>{{ bankAccount?.bank || 'No disponible' }}</td>
          </tr>
          <!-- row 4 -->
          <tr>
            <td>Tipo</td>
            <td>{{ bankAccount?.type || 'No disponible' }}</td>
          </tr>
          <!-- row 5 -->
          <tr>
            <td>Cuenta</td>
            <td>{{ bankAccount?.bankAccount || 'No disponible' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { DocumentDuplicateIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  eventId: {
    type: String,
    required: true
  }
});

const bankAccount = ref(null);
const textToCopy = ref('');
const copiedMessage = ref('');

// Función para obtener los datos bancarios del evento
const fetchBankAccount = async () => {
  const db = getFirestore();
  const eventDocRef = doc(db, 'events', props.eventId);

  try {
    const eventDocSnap = await getDoc(eventDocRef);
    if (eventDocSnap.exists()) {
      const eventData = eventDocSnap.data();
      
      // Verificar si existe bankTransferDataId en el evento
      if (eventData && eventData.bankTransferDataId) {
        // Obtener los datos bancarios desde la colección bank-accounts
        const bankAccountDocRef = doc(db, 'bank-accounts', eventData.bankTransferDataId);
        const bankAccountDocSnap = await getDoc(bankAccountDocRef);
        
        if (bankAccountDocSnap.exists()) {
          // Almacenar los datos de la cuenta bancaria
          bankAccount.value = bankAccountDocSnap.data();
          
          // Crear el texto para copiar
          textToCopy.value = `${bankAccount.value.name || ''} ${bankAccount.value.id || ''} ${bankAccount.value.bank || ''} ${bankAccount.value.type || ''} ${bankAccount.value.bankAccount || ''}`;
        } else {
          console.warn('No se encontró la cuenta bancaria con el ID proporcionado');
          textToCopy.value = 'Datos de transferencia no disponibles';
        }
      } else {
        console.warn('No hay ID de cuenta bancaria asociado a este evento');
        textToCopy.value = 'Datos de transferencia no disponibles';
      }
    } else {
      console.error('No se encontró el evento con el ID proporcionado');
    }
  } catch (error) {
    console.error('Error al obtener los datos del evento o cuenta bancaria:', error);
  }
};

// Función para copiar al portapapeles
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(textToCopy.value);
    copiedMessage.value = 'Datos copiado al portapapeles';
    
    // Limpiar el mensaje después de 2 segundos
    setTimeout(() => {
      copiedMessage.value = '';
    }, 2000);
  } catch (error) {
    copiedMessage.value = 'Error al copiar el texto';
    console.error('Error al copiar al portapapeles:', error);
  }
};

// Exponer funciones para que sean utilizables desde componentes padres
defineExpose({
  fetchBankAccount,
  bankAccount
});

// Cargar los datos bancarios cuando el componente se monta
onMounted(() => {
  fetchBankAccount();
});
</script>