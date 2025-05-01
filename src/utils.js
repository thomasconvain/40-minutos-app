// utils.js
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de tener configurada tu instancia de Firebase

export const fetchSpectators = async (eventId) => {
  try {
    const spectatorsRef = collection(db, 'spectators');
    let q = spectatorsRef;
    
    // Si se proporciona un ID de evento, lo convertimos en un array para usar array-contains-any
    if (eventId) {
      // Convertimos el único ID en un array para mantener la compatibilidad con la consulta existente
      const eventIds = [eventId];
      q = query(spectatorsRef, where('subscribedEventsId', 'array-contains-any', eventIds));
    }
    
    const querySnapshot = await getDocs(q);
    let total = 0;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.numberOfPeople) {
        total += (data.numberOfPeople + data.numberOfCompanions);
      }
    });
    return total; // Retorna el total de personas inscritas (filtrado por eventos si se proporcionan IDs)
  } catch (error) {
    console.error('Error obteniendo los documentos: ', error);
    return 0; // Retorna 0 en caso de error
  }
};

/**
 * Añade un espectador al array zSpectator en un documento de evento usando la nueva estructura de datos
 * @param {string} eventId - ID del evento
 * @param {object} spectatorData - Datos del espectador
 * @param {string} spectatorData.id - ID del espectador
 * @param {number} spectatorData.numberOfCompanions - Número de acompañantes
 * @param {string} [spectatorData.nameComplete] - Nombre completo del espectador
 * @returns {Promise<boolean>} - true si la operación fue exitosa, false en caso contrario
 */
export const addSpectatorToEvent = async (eventId, spectatorData) => {
  try {
    if (!eventId || !spectatorData || !spectatorData.id) {
      console.error('Se requiere un ID de evento y datos del espectador válidos');
      return false;
    }

    // Obtener referencia al documento del evento
    const eventRef = doc(db, 'events', eventId);
    
    // Verificar que el evento existe
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      console.error('El evento no existe');
      return false;
    }

    // Verificar si el espectador ya está registrado en este evento
    const eventData = eventSnap.data();
    if (eventData.zSpectator && eventData.zSpectator.some(spec => spec.spectatorId === spectatorData.id)) {
      // Si el espectador existe pero no tiene nameComplete, actualizar ese campo
      const existingIndex = eventData.zSpectator.findIndex(spec => spec.spectatorId === spectatorData.id);
      if (existingIndex !== -1 && !eventData.zSpectator[existingIndex].nameComplete) {
        // Obtener los datos del espectador para generar nameComplete
        const spectatorDocRef = doc(db, 'spectators', spectatorData.id);
        const spectatorDoc = await getDoc(spectatorDocRef);
        let nameCompleteValue = '';
        
        if (spectatorDoc.exists()) {
          const spectatorData = spectatorDoc.data();
          nameCompleteValue = `${spectatorData.name || ''} ${spectatorData.lastName || ''}`.trim();
        } else {
          // Si el documento no existe o no tiene estos campos, usar el nameComplete proporcionado
          nameCompleteValue = spectatorData.nameComplete || '';
        }
        
        // Crear una copia del array para poder modificarlo
        const updatedSpectators = [...eventData.zSpectator];
        updatedSpectators[existingIndex] = {
          ...updatedSpectators[existingIndex],
          nameComplete: nameCompleteValue
        };
        
        // Actualizar el documento con el nuevo array
        await updateDoc(eventRef, { zSpectator: updatedSpectators });
        console.log('Actualizado nameComplete para espectador existente:', {
          eventId,
          spectatorId: spectatorData.id,
          nameComplete: nameCompleteValue
        });
      } else {
        console.log('El espectador ya está registrado en este evento:', {
          eventId,
          spectatorId: spectatorData.id
        });
      }
      return true; // Retornar true porque el espectador ya está en el evento
    }

    // Crear un objeto con los datos según el nuevo modelo de datos
    const spectatorForEvent = {
      spectatorId: spectatorData.id,
      numberOfCompanions: spectatorData.numberOfCompanions || 0,
      nameComplete: spectatorData.nameComplete || '',
      evaluationId: null,
      hasCheckIn: false,
      hasCheckOut: false,
      paymentId: null
    };

    // Verificar si el evento ya tiene el campo zSpectator
    if (eventData.zSpectator) {
      // Si ya existe el array, añadir el nuevo espectador
      await updateDoc(eventRef, {
        zSpectator: arrayUnion(spectatorForEvent)
      });
    } else {
      // Si no existe, crear el array con el primer espectador
      await updateDoc(eventRef, {
        zSpectator: [spectatorForEvent]
      });
    }

    console.log('Espectador añadido exitosamente al evento:', {
      eventId,
      spectatorId: spectatorData.id,
      numberOfCompanions: spectatorForEvent.numberOfCompanions
    });
    return true;
  } catch (error) {
    console.error('Error al añadir espectador al evento:', error);
    return false;
  }
};
