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
 * Añade un espectador al array de espectadores en un documento de evento
 * @param {string} eventId - ID del evento
 * @param {object} spectatorData - Datos del espectador
 * @param {string} spectatorData.id - ID del espectador
 * @param {string} spectatorData.name - Nombre del espectador
 * @param {string} spectatorData.lastName - Apellido del espectador (opcional)
 * @param {number} spectatorData.numberOfCompanions - Número de acompañantes
 * @param {string} spectatorData.email - Correo electrónico del espectador
 * @param {string} spectatorData.phone - Teléfono del espectador (opcional)
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
    if (eventData.eventSpectators && eventData.eventSpectators.some(spec => spec.email === spectatorData.email)) {
      console.log('El espectador ya está registrado en este evento:', {
        eventId,
        email: spectatorData.email
      });
      return true; // Retornar true porque el espectador ya está en el evento
    }

    // Crear un objeto con los datos relevantes del espectador para añadir al evento
    const spectatorForEvent = {
      id: spectatorData.id,
      name: spectatorData.name || '',
      lastName: spectatorData.lastName || '',
      numberOfCompanions: spectatorData.numberOfCompanions || 0,
      email: spectatorData.email || '',
      phone: spectatorData.phone || '',
      registeredAt: new Date() // Añadir timestamp para saber cuándo se registró
    };

    // Verificar si el evento ya tiene el campo eventSpectators
    if (eventData.eventSpectators) {
      // Si ya existe el array, añadir el nuevo espectador
      await updateDoc(eventRef, {
        eventSpectators: arrayUnion(spectatorForEvent)
      });
    } else {
      // Si no existe, crear el array con el primer espectador
      await updateDoc(eventRef, {
        eventSpectators: [spectatorForEvent]
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
