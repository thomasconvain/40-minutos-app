// Script para actualizar todos los espectadores existentes en eventos activos
// Añadiendo los campos wasCheckedIn y wasCheckedOut
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc 
} = require('firebase/firestore');

// Configuración de Firebase (obtenida desde el archivo firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBLgwoTQ1EB59nr9rerF0gonBbblZ9IJ0g",
  authDomain: "minutos-87fe9.firebaseapp.com",
  projectId: "minutos-87fe9",
  storageBucket: "minutos-87fe9.appspot.com",
  messagingSenderId: "28186647799",
  appId: "1:28186647799:web:1228819cff4f9d77c987f2",
  measurementId: "G-0YK2NL06SG"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función principal
async function updateAllEventSpectators() {
  try {
    console.log('Iniciando actualización de espectadores...');
    
    // 1. Obtener todos los eventos activos
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    console.log(`Se encontraron ${querySnapshot.size} eventos activos.`);
    
    let totalSpectators = 0;
    let updatedSpectators = 0;
    
    // 2. Procesar cada evento
    for (const eventDoc of querySnapshot.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();
      
      console.log(`Procesando evento: ${eventData.name || eventId}`);
      
      // Verificar si el evento tiene espectadores
      if (!eventData.eventSpectators || !Array.isArray(eventData.eventSpectators)) {
        console.log(`- El evento ${eventId} no tiene espectadores.`);
        continue;
      }
      
      const spectators = eventData.eventSpectators;
      totalSpectators += spectators.length;
      
      console.log(`- El evento tiene ${spectators.length} espectadores registrados.`);
      
      // Revisar y actualizar cada espectador
      const updatedSpectators = spectators.map(spectator => {
        // Si ya tiene los campos, mantenerlos; de lo contrario, agregarlos
        return {
          ...spectator,
          wasCheckedIn: spectator.wasCheckedIn === true || spectator.isChecked === true || false,
          wasCheckedOut: spectator.wasCheckedOut === true || spectator.isCheckedOut === true || false
        };
      });
      
      // Actualizar el documento del evento
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        eventSpectators: updatedSpectators
      });
      
      console.log(`- Espectadores actualizados para el evento ${eventId}`);
      updatedSpectators += spectators.length;
    }
    
    console.log('\nResumen de la actualización:');
    console.log(`- Total de eventos procesados: ${querySnapshot.size}`);
    console.log(`- Total de espectadores: ${totalSpectators}`);
    console.log(`- Espectadores actualizados: ${updatedSpectators}`);
    console.log('\nProceso completado exitosamente!');
    
  } catch (error) {
    console.error('Error durante la actualización:', error);
  }
}

// Ejecutar la función principal
updateAllEventSpectators()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error en el script:', err);
    process.exit(1);
  });