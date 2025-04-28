const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

// @todo 
// - arreglar los checkin por checkIn
// - que paymentMethodIds esté dentro de settings
// - que no venga la llave "place"
// - no esta sacando bien numberOfCompanions
// - que solo venga createdAt, numberOfCompanions y spectatorId en zSpectator, nada más-.


// Configuración de Firebase
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
console.log('⚙️ Iniciando Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log('✅ Firebase inicializado correctamente');

// ID del evento a clonar
const SOURCE_EVENT_ID = 'W3JiRa9wz4G7axLTDjbW';

// Función para generar un código de invitación aleatorio
function generateRandomCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

// Función para clonar un evento con la nueva estructura
async function cloneEvent() {
  console.log(`Iniciando clonación del evento ${SOURCE_EVENT_ID}...`);
  
  try {
    // Obtener el evento fuente
    const sourceEventRef = doc(db, 'events', SOURCE_EVENT_ID);
    const sourceEventSnapshot = await getDoc(sourceEventRef);
    
    if (!sourceEventSnapshot.exists()) {
      console.error(`El evento fuente con ID ${SOURCE_EVENT_ID} no existe.`);
      return;
    }
    
    const sourceEventData = sourceEventSnapshot.data();
    console.log('Evento fuente encontrado');
    
    // Transformar eventSpectators a zSpectator
    let zSpectator = [];
    if (sourceEventData.eventSpectators && Array.isArray(sourceEventData.eventSpectators)) {
      console.log(`Transformando ${sourceEventData.eventSpectators.length} espectadores al nuevo formato...`);
      
      zSpectator = sourceEventData.eventSpectators.map((spectator, index) => {
        // Crear un ID único para el espectador
        const spectatorId = spectator.id || `spectator_${index}_${Date.now()}`;
        
        return {
          // Solo los tres campos relevantes según SpectatorInfo
          createdAt: spectator.createdAt || new Date(),
          spectatorId: spectatorId,
          numberOfCompanions: spectator.numberOfPeople ? spectator.numberOfPeople - 1 : 0,
          
          // Campos adicionales con valores predeterminados
          evaluationId: 0,
          hasCheckin: false,
          hasCheckout: false,
          paymentId: ""
        };
      });
      
      console.log(`Transformados ${zSpectator.length} espectadores al nuevo formato`);
    }
    
    // Crear el nuevo evento con estructura actualizada
    const newEvent = {
      _ref: '',
      assemblyId: sourceEventData.assemblyId || '',
      chapterId: sourceEventData.chapterId || '',
      contentReferenceId: sourceEventData.contentReferenceId || '',
      date: sourceEventData.date || new Date(),
      hostId: sourceEventData.hostId || '',
      venueId: sourceEventData.venueId || '',
      
      settings: {
        invitationCode: sourceEventData.settings?.invitationCode || generateRandomCode(6),
        isActive: sourceEventData.settings?.isActive !== undefined ? sourceEventData.settings.isActive : true,
        isPrivate: sourceEventData.settings?.isPrivate !== undefined ? sourceEventData.settings.isPrivate : false,
        isTipAccepted: sourceEventData.settings?.isTipAccepted !== undefined ? sourceEventData.settings.isTipAccepted : true
      },
      
      paymentMethodIds: sourceEventData.paymentMethodIds || [],
      
      status: {
        isCheckinOpen: sourceEventData.status?.isCheckinOpen !== undefined ? sourceEventData.status.isCheckinOpen : false,
        isFinished: sourceEventData.status?.isFinished !== undefined ? sourceEventData.status.isFinished : false,
        isReservationOpen: sourceEventData.status?.isReservationOpen !== undefined ? sourceEventData.status.isReservationOpen : true
      },
      
      zSpectator: zSpectator
    };
    
    // Copiar campos opcionales
    if (sourceEventData.name) newEvent.name = sourceEventData.name;
    if (sourceEventData.description) newEvent.description = sourceEventData.description;
    if (sourceEventData.place) newEvent.place = sourceEventData.place;
    if (sourceEventData.themes_id) newEvent.themes_id = sourceEventData.themes_id;
    
    // Crear el nuevo documento
    const eventsCollection = collection(db, 'events');
    const newEventRef = doc(eventsCollection);
    await setDoc(newEventRef, newEvent);
    
    // Actualizar el ID de referencia
    await updateDoc(newEventRef, {
      _ref: newEventRef.id
    });
    
    console.log(`Evento clonado exitosamente con ID: ${newEventRef.id}`);
    
    // Guardar los detalles en un archivo
    const outputDir = path.join(__dirname, './outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `cloned-event-${newEventRef.id}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      sourceEventId: SOURCE_EVENT_ID,
      newEventId: newEventRef.id,
      newEvent: {
        ...newEvent,
        _ref: newEventRef.id
      }
    }, null, 2));
    
    console.log(`Detalles guardados en: ${outputFile}`);
    return newEventRef.id;
  } catch (error) {
    console.error('Error al clonar el evento:', error);
    throw error;
  }
}

// Ejecutar la clonación
cloneEvent()
  .then(newEventId => {
    console.log(`Proceso completado. Nuevo evento ID: ${newEventId}`);
  })
  .catch(error => {
    console.error('Error en el script:', error);
  });