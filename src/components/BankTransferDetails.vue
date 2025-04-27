<template>
  <div class="w-full">
    <div v-if="loading" class="flex justify-center my-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
    
    <div v-else-if="!bankAccount" class="alert alert-warning my-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <span>No se encontraron datos de cuenta bancaria para este evento. Por favor, contacta al organizador.</span>
    </div>
    
    <div v-else class="overflow-x-auto flex flex-col mt-4">
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
const loading = ref(false);

// Función para obtener los datos bancarios del evento
const fetchBankAccount = async () => {
  loading.value = true;
  bankAccount.value = null; // Reiniciamos el valor para manejar actualizaciones
  
  const db = getFirestore();
  const eventDocRef = doc(db, 'events', props.eventId);

  try {
    const eventDocSnap = await getDoc(eventDocRef);
    if (eventDocSnap.exists()) {
      const eventData = eventDocSnap.data();
      
      // Verificar si existen métodos de pago en el evento
      if (eventData?.settings?.paymentMethodIds && eventData.settings.paymentMethodIds.length > 0) {
        console.log('Métodos de pago encontrados:', eventData.settings.paymentMethodIds);
        
        // Buscar un método de pago con paymentType "Transferencia electrónica"
        let transferMethod = null;
        
        for (const methodId of eventData.settings.paymentMethodIds) {
          const paymentMethodRef = doc(db, 'payment-methods', methodId);
          const paymentMethodSnap = await getDoc(paymentMethodRef);
          
          if (paymentMethodSnap.exists()) {
            const methodData = paymentMethodSnap.data();
            console.log(`Método de pago ${methodId}:`, methodData);
            
            // Verificar si es un método de transferencia bancaria
            if (methodData.paymentType === 'Transferencia electrónica') {
              transferMethod = methodData;
              console.log('Método de transferencia encontrado:', transferMethod);
              break;
            }
          }
        }
        
        if (transferMethod) {
          // Extraer datos de la cuenta bancaria del método de transferencia
          bankAccount.value = {
            name: transferMethod.name,
            id: transferMethod.id, // RUT está en id
            bank: transferMethod.bank,
            type: transferMethod.type, // Tipo está en type
            bankAccount: transferMethod.number // Número está en number
          };
          
          // Crear el texto para copiar
          textToCopy.value = `${bankAccount.value.name || ''} ${bankAccount.value.id || ''} ${bankAccount.value.bank || ''} ${bankAccount.value.type || ''} ${bankAccount.value.bankAccount || ''}`;
        } else {
          console.warn('No se encontró método de pago por transferencia electrónica');
          bankAccount.value = null;
          textToCopy.value = 'Datos de transferencia no disponibles';
        }
      } else {
        console.warn('No hay métodos de pago asociados a este evento');
        bankAccount.value = null;
        textToCopy.value = 'Datos de transferencia no disponibles';
      }
    } else {
      console.error('No se encontró el evento con el ID proporcionado');
      bankAccount.value = null;
    }
  } catch (error) {
    console.error('Error al obtener los datos del evento o métodos de pago:', error);
    bankAccount.value = null;
  } finally {
    loading.value = false;
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