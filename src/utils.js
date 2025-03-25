// utils.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase'; // Asegúrate de tener configurada tu instancia de Firebase

export const fetchSpectators = async (eventIds) => {
  try {
    const spectatorsRef = collection(db, 'spectators');
    let q = spectatorsRef;

    if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
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