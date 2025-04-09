// utils.js
import { collection, getDocs, query, where } from 'firebase/firestore';
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
        total += data.numberOfPeople;
      }
    });
    return total; // Retorna el total de personas inscritas (filtrado por eventos si se proporcionan IDs)
  } catch (error) {
    console.error('Error obteniendo los documentos: ', error);
    return 0; // Retorna 0 en caso de error
  }
};